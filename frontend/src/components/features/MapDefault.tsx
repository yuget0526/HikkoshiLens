"use client";
/**
 * Map のデフォルト実装コンポーネント。
 * - Mapbox の初期化
 * - 中心ピンの配置と移動
 * - 国土交通省DIDレイヤーの表示
 */

import * as React from "react";
import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";
import { useMapStore } from "@/stores/mapStore";
import {
  MAPBOX_STYLES,
  resolveMapboxStyle,
  type MapboxStyleId,
} from "@/constants/mapbox";
import { DEFAULT_MAP_CONFIG, LANGUAGE_CONFIG } from "@/features/map/constants";

export type MapDefaultProps = {
  styleId?: MapboxStyleId;
  center?: [number, number]; // [longitude, latitude]
};

function MapDefaultBase({ styleId, center: initialCenter }: MapDefaultProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const isInitializedRef = useRef(false);
  const { setMap, setStyle } = useMapStore();

  const styleUrl = useMemo(() => {
    const id = styleId ?? DEFAULT_MAP_CONFIG.style;
    return resolveMapboxStyle(MAPBOX_STYLES[id], undefined);
  }, [styleId]);

  // 座標が変更されたときに地図の中心とマーカーの位置を更新
  useEffect(() => {
    if (mapInstanceRef.current && initialCenter) {
      mapInstanceRef.current.setCenter(initialCenter);
      if (markerRef.current) {
        markerRef.current.setLngLat(initialCenter);
      }
    }
  }, [initialCenter]);

  // スタイルが変更されたときの処理
  useEffect(() => {
    if (mapInstanceRef.current && styleUrl) {
      mapInstanceRef.current.setStyle(styleUrl);
    }
  }, [styleUrl]);

  // 地図インスタンスの初期化（一度だけ）
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    isInitializedRef.current = true;

    // Mapboxのアクセストークンを設定
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

    // 地図インスタンスの作成
    const mapInstance = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: initialCenter || DEFAULT_MAP_CONFIG.center,
      zoom: DEFAULT_MAP_CONFIG.zoom,
    });

    // 日本語対応を追加
    const language = new MapboxLanguage(LANGUAGE_CONFIG);
    mapInstance.addControl(language);

    // 地図のロードを待ってから初期化を行う
    mapInstance.on("load", () => {
      mapInstanceRef.current = mapInstance;
      setMap(mapInstance);
      setStyle(DEFAULT_MAP_CONFIG.style);

      // 初期位置の取得
      const centerCoords = mapInstance.getCenter();

      // マーカーの追加・描画は不要なので削除
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMap(null);
      isInitializedRef.current = false;
    };
  }, []); // 依存配列を空にして一度だけ実行

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="fixed top-0 left-0 w-screen h-screen"
        data-style-id={styleId}
      />
    </div>
  );
}

// MapDefaultコンポーネントをメモ化
const MapDefault = React.memo(MapDefaultBase);
export default MapDefault;
