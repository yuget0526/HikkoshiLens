/**
 * 国土交通省人口集中地区（DID）レイヤー用のReactフック
 * - レイヤーの状態管理
 * - 地図の移動に応じた自動データロード
 * - エラーハンドリング
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map } from "mapbox-gl";
import { createMLITDIDLayer } from "./layer";
import type { MLITDIDLayerAPI, MLITDIDLayerState } from "./types";

export function useMLITDIDLayer(map: Map | null) {
  const [state, setState] = useState<MLITDIDLayerState>({
    isVisible: false,
    isLoading: false,
    error: null,
    setVisible: (isVisible: boolean) => {
      setState((prev: MLITDIDLayerState) => ({ ...prev, isVisible }));
    },
    setLoading: (isLoading: boolean) => {
      setState((prev: MLITDIDLayerState) => ({ ...prev, isLoading }));
    },
    setError: (error: Error | null) => {
      setState((prev: MLITDIDLayerState) => ({ ...prev, error }));
    },
  });

  const layerRef = useRef<MLITDIDLayerAPI | null>(null);
  const lastViewRef = useRef<string>("");

  // レイヤーの初期化
  useEffect(() => {
    if (!map) return;

    try {
      layerRef.current = createMLITDIDLayer();
      layerRef.current.initialize(map);
    } catch (error) {
      console.error("Failed to initialize MLIT DID layer:", error);
      state.setError(error as Error);
    }

    return () => {
      if (layerRef.current && map) {
        layerRef.current.remove(map);
      }
    };
  }, [map]);

  // 地図の移動に応じてデータを自動ロード
  const loadDIDDataForCurrentView = useCallback(async () => {
    if (!map || !layerRef.current || !state.isVisible) return;

    try {
      const center = map.getCenter();
      const zoom = Math.round(map.getZoom());

      // centerがnullの場合は何もしない
      if (!center) return;

      // ズームレベルが低すぎる場合はロードしない
      if (zoom < 10) {
        return;
      }

      const viewKey = `${center.lat.toFixed(4)},${center.lng.toFixed(
        4
      )},${zoom}`;

      // 同じ視点の場合はスキップ
      if (lastViewRef.current === viewKey) {
        return;
      }

      state.setLoading(true);
      state.setError(null);
      lastViewRef.current = viewKey;

      await layerRef.current.loadDIDDataForMapView(
        map,
        {
          lat: center.lat,
          lng: center.lng,
        },
        zoom
      );
    } catch (error) {
      console.error("Failed to load DID data for current view:", error);
      state.setError(error as Error);
    } finally {
      state.setLoading(false);
    }
  }, [map, state.isVisible]);

  // 地図のイベントリスナーを設定
  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      loadDIDDataForCurrentView();
    };

    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map, loadDIDDataForCurrentView]);

  // 表示/非表示の切り替え
  useEffect(() => {
    if (!map || !layerRef.current) return;

    if (state.isVisible) {
      layerRef.current.show(map);
      loadDIDDataForCurrentView();
    } else {
      layerRef.current.hide(map);
    }
  }, [map, state.isVisible, loadDIDDataForCurrentView]);

  const toggleVisibility = useCallback(() => {
    state.setVisible(!state.isVisible);
  }, [state.isVisible]);

  const refreshData = useCallback(() => {
    lastViewRef.current = "";
    loadDIDDataForCurrentView();
  }, [loadDIDDataForCurrentView]);

  return {
    ...state,
    toggleVisibility,
    refreshData,
  };
}

// カスタムフック：複数のMLITレイヤーを管理
export function useMLITLayers(map: Map | null) {
  const didLayer = useMLITDIDLayer(map);

  return {
    did: didLayer,
  };
}
