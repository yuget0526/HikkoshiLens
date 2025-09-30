/**
 * 国土交通省 人口集中地区（DID）レイヤーを管理するReactフック
 */

import { useEffect, useRef, useCallback } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import { MLITDIDLayer } from "../layers/mlit-did-layer";
import type { MLITDIDLayerConfig } from "../layers/types/mlit-did";

export interface UseMLITDIDLayerOptions {
  /** レイヤーの初期設定 */
  config?: Partial<MLITDIDLayerConfig>;
  /** レイヤーを自動的に地図に追加するかどうか */
  autoAdd?: boolean;
}

export interface UseMLITDIDLayerReturn {
  /** レイヤーインスタンス */
  layer: MLITDIDLayer | null;
  /** レイヤーを地図に追加 */
  addLayer: () => void;
  /** レイヤーを地図から削除 */
  removeLayer: () => void;
  /** レイヤーの表示/非表示を切り替え */
  toggleVisibility: () => void;
  /** レイヤーの表示状態を設定 */
  setVisibility: (visible: boolean) => void;
  /** レイヤーの透明度を設定 */
  setOpacity: (opacity: number) => void;
  /** レイヤーの色を設定 */
  setColors: (fillColor: string, strokeColor: string) => void;
  /** レイヤーが読み込まれているかどうか */
  isLoaded: boolean;
  /** 現在の設定を取得 */
  getConfig: () => MLITDIDLayerConfig | null;
}

/**
 * 国土交通省 人口集中地区（DID）レイヤーを管理するReactフック
 */
export function useMLITDIDLayer(
  map: MapboxMap | null,
  options: UseMLITDIDLayerOptions = {}
): UseMLITDIDLayerReturn {
  const { config = {}, autoAdd = true } = options;
  const layerRef = useRef<MLITDIDLayer | null>(null);

  // レイヤーを初期化
  useEffect(() => {
    if (!map) return;

    // 既存のレイヤーをクリーンアップ
    if (layerRef.current) {
      layerRef.current.removeFromMap();
      layerRef.current = null;
    }

    // 新しいレイヤーを作成
    layerRef.current = new MLITDIDLayer(map, config);

    // 自動追加が有効な場合は地図に追加
    if (autoAdd) {
      layerRef.current.addToMap();
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.removeFromMap();
        layerRef.current = null;
      }
    };
  }, [map, autoAdd]);

  // 設定が変更された場合の処理
  useEffect(() => {
    if (layerRef.current && Object.keys(config).length > 0) {
      if ("visible" in config && typeof config.visible === "boolean") {
        layerRef.current.setVisibility(config.visible);
      }
      if ("opacity" in config && typeof config.opacity === "number") {
        layerRef.current.setOpacity(config.opacity);
      }
      if (
        "fillColor" in config &&
        "strokeColor" in config &&
        config.fillColor &&
        config.strokeColor
      ) {
        layerRef.current.setColors(config.fillColor, config.strokeColor);
      }
    }
  }, [config]);

  const addLayer = useCallback(() => {
    if (layerRef.current) {
      layerRef.current.addToMap();
    }
  }, []);

  const removeLayer = useCallback(() => {
    if (layerRef.current) {
      layerRef.current.removeFromMap();
    }
  }, []);

  const toggleVisibility = useCallback(() => {
    if (layerRef.current) {
      const currentConfig = layerRef.current.getConfig();
      layerRef.current.setVisibility(!currentConfig.visible);
    }
  }, []);

  const setVisibility = useCallback((visible: boolean) => {
    if (layerRef.current) {
      layerRef.current.setVisibility(visible);
    }
  }, []);

  const setOpacity = useCallback((opacity: number) => {
    if (layerRef.current) {
      layerRef.current.setOpacity(opacity);
    }
  }, []);

  const setColors = useCallback((fillColor: string, strokeColor: string) => {
    if (layerRef.current) {
      layerRef.current.setColors(fillColor, strokeColor);
    }
  }, []);

  const getConfig = useCallback(() => {
    return layerRef.current ? layerRef.current.getConfig() : null;
  }, []);

  const isLoaded = layerRef.current ? layerRef.current.isLayerLoaded() : false;

  return {
    layer: layerRef.current,
    addLayer,
    removeLayer,
    toggleVisibility,
    setVisibility,
    setOpacity,
    setColors,
    isLoaded,
    getConfig,
  };
}
