// MLITDIDGeoJSON型からGeoJSON.FeatureCollection型へ変換する関数
import type { DIDResponse } from "@/lib/external-apis/mlit";
import type { Polygon, MultiPolygon } from "geojson";
function toGeoJSONFeatureCollection(
  data: DIDResponse
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: (data.features ?? []).map((f) => {
      let geometry: Polygon | MultiPolygon;
      if (f.geometry.type === "Polygon") {
        geometry = {
          type: "Polygon",
          coordinates: f.geometry.coordinates as number[][][],
        };
      } else {
        geometry = {
          type: "MultiPolygon",
          coordinates: f.geometry.coordinates as number[][][][],
        };
      }
      return {
        type: "Feature",
        geometry,
        properties: f.properties,
      };
    }),
  };
}
/**
 * 国土交通省人口集中地区（DID）レイヤーの実装
 * - Mapboxレイヤーの作成と管理
 * - レイヤーの表示/非表示の制御
 * - 人口集中地区データの動的ロードと更新処理
 */

import type { Map } from "mapbox-gl";
import type { MLITDIDLayerConfig, MLITDIDLayerAPI } from "./types";
import { getMLITDIDLayerClient } from "./client";

const DEFAULT_CONFIG: MLITDIDLayerConfig = {
  sourceId: "mlit-did-src",
  layerId: "mlit-did-fill",
  fillColor: "#FF6B6B", // Red color for DID areas
  strokeColor: "#CC5555",
  strokeWidth: 1,
  opacity: 0.6,
};

export function createMLITDIDLayer(
  config: Partial<MLITDIDLayerConfig> = {}
): MLITDIDLayerAPI {
  const layerConfig = { ...DEFAULT_CONFIG, ...config };
  const client = getMLITDIDLayerClient();

  return {
    initialize(map: Map) {
      try {
        // ソースを追加
        if (!map.getSource(layerConfig.sourceId)) {
          map.addSource(layerConfig.sourceId, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [],
            },
          });
        }

        // 塗りつぶしレイヤーを追加
        if (!map.getLayer(layerConfig.layerId)) {
          map.addLayer({
            id: layerConfig.layerId,
            type: "fill",
            source: layerConfig.sourceId,
            paint: {
              "fill-color": layerConfig.fillColor,
              "fill-opacity": layerConfig.opacity,
            },
          });
        }

        // 境界線レイヤーを追加
        const strokeLayerId = `${layerConfig.layerId}-stroke`;
        if (!map.getLayer(strokeLayerId)) {
          map.addLayer({
            id: strokeLayerId,
            type: "line",
            source: layerConfig.sourceId,
            paint: {
              "line-color": layerConfig.strokeColor,
              "line-width": layerConfig.strokeWidth,
              "line-opacity": layerConfig.opacity,
            },
          });
        }

        console.log("MLIT DID layer initialized successfully");
      } catch (error) {
        console.error("Failed to initialize MLIT DID layer:", error);
        throw error;
      }
    },

    show(map: Map) {
      try {
        if (map.getLayer(layerConfig.layerId)) {
          map.setLayoutProperty(layerConfig.layerId, "visibility", "visible");
        }
        const strokeLayerId = `${layerConfig.layerId}-stroke`;
        if (map.getLayer(strokeLayerId)) {
          map.setLayoutProperty(strokeLayerId, "visibility", "visible");
        }
      } catch (error) {
        console.error("Failed to show MLIT DID layer:", error);
      }
    },

    hide(map: Map) {
      try {
        if (map.getLayer(layerConfig.layerId)) {
          map.setLayoutProperty(layerConfig.layerId, "visibility", "none");
        }
        const strokeLayerId = `${layerConfig.layerId}-stroke`;
        if (map.getLayer(strokeLayerId)) {
          map.setLayoutProperty(strokeLayerId, "visibility", "none");
        }
      } catch (error) {
        console.error("Failed to hide MLIT DID layer:", error);
      }
    },

    remove(map: Map) {
      try {
        const strokeLayerId = `${layerConfig.layerId}-stroke`;

        // レイヤーを削除
        if (map.getLayer(strokeLayerId)) {
          map.removeLayer(strokeLayerId);
        }
        if (map.getLayer(layerConfig.layerId)) {
          map.removeLayer(layerConfig.layerId);
        }

        // ソースを削除
        if (map.getSource(layerConfig.sourceId)) {
          map.removeSource(layerConfig.sourceId);
        }

        console.log("MLIT DID layer removed successfully");
      } catch (error) {
        console.error("Failed to remove MLIT DID layer:", error);
      }
    },

    update(map: Map, data: GeoJSON.FeatureCollection) {
      try {
        const source = map.getSource(
          layerConfig.sourceId
        ) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(data);
        }
      } catch (error) {
        console.error("Failed to update MLIT DID layer:", error);
      }
    },

    async loadDIDDataForMapView(
      map: Map,
      center: {
        lat: number;
        lng: number;
      },
      zoom: number
    ) {
      try {
        const data = await client.getDIDDataForMapView(center, zoom);
        // dataをGeoJSON.FeatureCollection型として渡す
        const geojson = toGeoJSONFeatureCollection(data);
        this.update(map, geojson);
        console.log(`Loaded ${data.features.length} DID features`);
      } catch (error) {
        console.error("Failed to load DID data for map view:", error);
        throw error;
      }
    },
  };
}
