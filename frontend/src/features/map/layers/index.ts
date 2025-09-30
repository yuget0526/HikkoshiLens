/**
 * 国土交通省 人口集中地区（DID）レイヤー関連のエクスポート
 */

// レイヤークラス
export { MLITDIDLayer } from "./mlit-did-layer";

// フック
export { useMLITDIDLayer } from "../hooks/useMLITDIDLayer";
export type {
  UseMLITDIDLayerOptions,
  UseMLITDIDLayerReturn,
} from "../hooks/useMLITDIDLayer";

// コンポーネント
export { MLITDIDLayerControl } from "../../../components/features/MLITDIDLayerControl";

// 型定義
export type {
  MLITDIDLayerConfig,
  MLITDIDLayerSource,
  MLITDIDFillLayer,
  MLITDIDStrokeLayer,
  MLITDIDLayer as MLITDIDLayerType,
} from "./types/mlit-did";

export { DEFAULT_MLIT_DID_CONFIG } from "./types/mlit-did";
