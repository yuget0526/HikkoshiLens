/**
 * 国土交通省 人口集中地区（DID）レイヤー
 */

import type { Map as MapboxMap } from "mapbox-gl";
import { getMLITClient } from "@/lib/external-apis/mlit";
import type {
  MLITDIDLayerConfig,
  MLITDIDLayerSource,
  MLITDIDFillLayer,
  MLITDIDStrokeLayer,
} from "./types/mlit-did";
import { DEFAULT_MLIT_DID_CONFIG } from "./types/mlit-did";

export class MLITDIDLayer {
  private map: MapboxMap;
  private config: MLITDIDLayerConfig;
  private readonly sourceId = "mlit-did-source";
  private readonly fillLayerId = "mlit-did-fill";
  private readonly strokeLayerId = "mlit-did-stroke";
  private isLoaded = false;
  private currentBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null = null;
  private currentZoom = 0;

  constructor(map: MapboxMap, config: Partial<MLITDIDLayerConfig> = {}) {
    this.map = map;
    this.config = { ...DEFAULT_MLIT_DID_CONFIG, ...config };
    this.setupEventListeners();
  }

  /**
   * レイヤーを地図に追加
   */
  addToMap(): void {
    if (this.isLoaded) return;

    // データソースを追加
    const source: MLITDIDLayerSource = {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    };

    this.map.addSource(this.sourceId, source);

    // 塗りつぶしレイヤーを追加
    const fillLayer: MLITDIDFillLayer = {
      id: this.fillLayerId,
      type: "fill",
      source: this.sourceId,
      layout: {
        visibility: this.config.visible ? "visible" : "none",
      },
      paint: {
        "fill-color": this.config.fillColor,
        "fill-opacity": this.config.opacity,
      },
      minzoom: this.config.minZoom,
      maxzoom: this.config.maxZoom,
    };

    this.map.addLayer(fillLayer);

    // 境界線レイヤーを追加
    const strokeLayer: MLITDIDStrokeLayer = {
      id: this.strokeLayerId,
      type: "line",
      source: this.sourceId,
      layout: {
        visibility: this.config.visible ? "visible" : "none",
      },
      paint: {
        "line-color": this.config.strokeColor,
        "line-width": this.config.strokeWidth,
        "line-opacity": this.config.opacity,
      },
      minzoom: this.config.minZoom,
      maxzoom: this.config.maxZoom,
    };

    this.map.addLayer(strokeLayer);

    this.isLoaded = true;
    this.updateData();
  }

  /**
   * レイヤーを地図から削除
   */
  removeFromMap(): void {
    if (!this.isLoaded) return;

    if (this.map.getLayer(this.strokeLayerId)) {
      this.map.removeLayer(this.strokeLayerId);
    }
    if (this.map.getLayer(this.fillLayerId)) {
      this.map.removeLayer(this.fillLayerId);
    }
    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId);
    }

    this.isLoaded = false;
  }

  /**
   * レイヤーの表示/非表示を切り替え
   */
  setVisibility(visible: boolean): void {
    this.config.visible = visible;

    if (!this.isLoaded) return;

    const visibility = visible ? "visible" : "none";
    this.map.setLayoutProperty(this.fillLayerId, "visibility", visibility);
    this.map.setLayoutProperty(this.strokeLayerId, "visibility", visibility);

    if (visible) {
      this.updateData();
    }
  }

  /**
   * レイヤーの透明度を設定
   */
  setOpacity(opacity: number): void {
    this.config.opacity = Math.max(0, Math.min(1, opacity));

    if (!this.isLoaded) return;

    this.map.setPaintProperty(
      this.fillLayerId,
      "fill-opacity",
      this.config.opacity
    );
    this.map.setPaintProperty(
      this.strokeLayerId,
      "line-opacity",
      this.config.opacity
    );
  }

  /**
   * レイヤーの色を設定
   */
  setColors(fillColor: string, strokeColor: string): void {
    this.config.fillColor = fillColor;
    this.config.strokeColor = strokeColor;

    if (!this.isLoaded) return;

    this.map.setPaintProperty(this.fillLayerId, "fill-color", fillColor);
    this.map.setPaintProperty(this.strokeLayerId, "line-color", strokeColor);
  }

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    this.map.on("moveend", () => {
      if (this.config.visible && this.isLoaded) {
        this.updateData();
      }
    });

    this.map.on("zoomend", () => {
      if (this.config.visible && this.isLoaded) {
        this.updateData();
      }
    });
  }

  /**
   * 現在の表示範囲の人口集中地区データを更新
   */
  private async updateData(): Promise<void> {
    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    if (!bounds) return;

    // ズームレベルがAPIの範囲外の場合は何もしない
    if (zoom < this.config.minZoom || zoom > this.config.maxZoom) {
      this.clearData();
      return;
    }

    const newBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    // 表示範囲やズームレベルが大きく変わっていない場合は更新しない
    if (this.shouldSkipUpdate(newBounds, zoom)) {
      return;
    }

    try {
      const mlitClient = getMLITClient();

      // 境界の中心点を計算
      const centerLng = (newBounds.east + newBounds.west) / 2;
      const centerLat = (newBounds.north + newBounds.south) / 2;

      const didData = await mlitClient.getDIDDataForMapView(
        { lng: centerLng, lat: centerLat },
        Math.floor(zoom)
      );

      // GeoJSONの型をMapbox GLと互換性のある形に変換
      const mapboxGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: didData.features.map((feature) => {
          let geometry: GeoJSON.Geometry;
          if (feature.geometry.type === "Polygon") {
            geometry = {
              type: "Polygon",
              coordinates: feature.geometry.coordinates as number[][][],
            };
          } else {
            geometry = {
              type: "MultiPolygon",
              coordinates: feature.geometry.coordinates as number[][][][],
            };
          }
          return {
            type: "Feature",
            geometry,
            properties: feature.properties as GeoJSON.GeoJsonProperties,
          };
        }),
      };

      const source = this.map.getSource(
        this.sourceId
      ) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(mapboxGeoJSON);
      }

      this.currentBounds = newBounds;
      this.currentZoom = zoom;
    } catch (error) {
      console.error("Failed to fetch DID data:", error);
    }
  }

  /**
   * データの更新をスキップするかどうかを判定
   */
  private shouldSkipUpdate(
    newBounds: typeof this.currentBounds,
    newZoom: number
  ): boolean {
    if (!this.currentBounds) return false;

    const zoomDiff = Math.abs(newZoom - this.currentZoom);
    const latDiff =
      Math.abs(newBounds!.north - this.currentBounds.north) +
      Math.abs(newBounds!.south - this.currentBounds.south);
    const lngDiff =
      Math.abs(newBounds!.east - this.currentBounds.east) +
      Math.abs(newBounds!.west - this.currentBounds.west);

    // ズームレベルの変更が0.5未満で、座標の変更が0.01度未満の場合はスキップ
    return zoomDiff < 0.5 && latDiff < 0.01 && lngDiff < 0.01;
  }

  /**
   * データをクリア
   */
  private clearData(): void {
    const source = this.map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }

  /**
   * レイヤーが読み込まれているかどうか
   */
  isLayerLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): MLITDIDLayerConfig {
    return { ...this.config };
  }
}
