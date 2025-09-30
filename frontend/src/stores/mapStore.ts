import { create } from "zustand";
import mapboxgl from "mapbox-gl";
import { DEFAULT_MAP_CONFIG, DEFAULT_CENTER } from "@/features/map/constants";
import type { MapboxStyleId } from "@/constants/mapbox";

type MapState = {
  // マップインスタンス
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map | null) => void;

  // スタイル関連
  currentStyle: MapboxStyleId;
  setStyle: (style: MapboxStyleId) => void;

  // ピンの状態管理
  pin: {
    position: { lng: number; lat: number } | null;
    visible: boolean;
  };
  setPinPosition: (position: { lng: number; lat: number } | null) => void;
  setPinVisible: (visible: boolean) => void;

  // 等時線（イソクロン）の状態管理
  isochrone: {
    enabled: boolean;
    visible: boolean;
    geojson: GeoJSON.FeatureCollection | null;
  };
  setIsochroneEnabled: (enabled: boolean) => void;
  setIsochroneVisible: (visible: boolean) => void;
  setIsochroneGeojson: (geojson: GeoJSON.FeatureCollection | null) => void;

  // 地図の中心位置
  center: { lng: number; lat: number };
  setCenter: (center: { lng: number; lat: number }) => void;
};

export const useMapStore = create<MapState>((set) => ({
  // マップインスタンスの初期状態
  map: null,
  setMap: (map) => set({ map }),

  // スタイルの初期状態
  currentStyle: DEFAULT_MAP_CONFIG.style,
  setStyle: (style) => set({ currentStyle: style }),

  // ピンの初期状態
  pin: {
    position: { ...DEFAULT_CENTER },
    visible: true,
  },
  setPinPosition: (position) =>
    set((state) => ({
      pin: { ...state.pin, position },
      center: position || state.center, // ピンの位置が変更されたら地図の中心も移動
    })),
  setPinVisible: (visible) =>
    set((state) => ({
      pin: { ...state.pin, visible },
    })),

  // 等時線（イソクロン）の初期状態
  isochrone: {
    enabled: true, // 機能は常にオン
    visible: false, // 表示はデフォルトでオフ
    geojson: null,
  },
  setIsochroneEnabled: (enabled) =>
    set((state) => ({
      isochrone: { ...state.isochrone, enabled },
    })),
  setIsochroneVisible: (visible) =>
    set((state) => ({
      isochrone: { ...state.isochrone, visible },
    })),
  setIsochroneGeojson: (geojson) =>
    set((state) => ({
      isochrone: { ...state.isochrone, geojson },
    })),

  // 地図の中心位置の初期状態
  center: { ...DEFAULT_CENTER },
  setCenter: (center) => set({ center }),
}));
