/**
 * 国土交通省人口集中地区（DID）レイヤーの型定義
 * - MLIT APIから取得した人口集中地区データの型定義
 * - レイヤー固有の設定や状態の型定義
 */

import type { Map } from "mapbox-gl";
import type { FeatureCollection } from "geojson";
import type { DIDProperties } from "@/lib/external-apis/mlit";

export interface MLITDIDLayerConfig {
  sourceId: string;
  layerId: string;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface MLITDIDLayerState {
  isVisible: boolean;
  isLoading: boolean;
  error: Error | null;
  setVisible: (isVisible: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
}

// DIDPropertiesを使用
export type MLITDIDFeatureProperties = DIDProperties;

export type MLITDIDGeoJSON = FeatureCollection<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  MLITDIDFeatureProperties
>;

export interface MLITDIDLayerAPI {
  initialize: (map: Map) => void;
  update: (map: Map, data: GeoJSON.FeatureCollection) => void;
  show: (map: Map) => void;
  hide: (map: Map) => void;
  remove: (map: Map) => void;
  loadDIDDataForMapView: (
    map: Map,
    center: {
      lat: number;
      lng: number;
    },
    zoom: number
  ) => Promise<void>;
}
