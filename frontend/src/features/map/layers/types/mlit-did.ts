/**
 * 国土交通省 人口集中地区（DID）レイヤーの型定義
 */

import type { FillLayerSpecification, LineLayerSpecification } from "mapbox-gl";

export interface MLITDIDLayerConfig {
  /** レイヤーの表示状態 */
  visible: boolean;
  /** レイヤーの透明度 (0-1) */
  opacity: number;
  /** 人口集中地区エリアの塗りつぶし色 */
  fillColor: string;
  /** 人口集中地区エリアの境界線色 */
  strokeColor: string;
  /** 境界線の太さ */
  strokeWidth: number;
  /** 最小ズームレベル（APIの制限により9以上） */
  minZoom: number;
  /** 最大ズームレベル（APIの制限により15以下） */
  maxZoom: number;
}

export interface MLITDIDLayerSource {
  type: "geojson";
  data: GeoJSON.FeatureCollection;
  lineMetrics?: boolean;
}

export interface MLITDIDFillLayer
  extends Omit<FillLayerSpecification, "source"> {
  id: "mlit-did-fill";
  type: "fill";
  source: string;
  layout?: {
    visibility: "visible" | "none";
  };
  paint: {
    "fill-color": string;
    "fill-opacity": number;
  };
}

export interface MLITDIDStrokeLayer
  extends Omit<LineLayerSpecification, "source"> {
  id: "mlit-did-stroke";
  type: "line";
  source: string;
  layout?: {
    visibility: "visible" | "none";
  };
  paint: {
    "line-color": string;
    "line-width": number;
    "line-opacity": number;
  };
}

export type MLITDIDLayer = MLITDIDFillLayer | MLITDIDStrokeLayer;

export const DEFAULT_MLIT_DID_CONFIG: MLITDIDLayerConfig = {
  visible: true,
  opacity: 0.6,
  fillColor: "#FF6B6B",
  strokeColor: "#CC5555",
  strokeWidth: 1,
  minZoom: 9,
  maxZoom: 15,
};
