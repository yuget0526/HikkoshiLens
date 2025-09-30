import { type MapboxStyleId } from "@/constants/mapbox";

/** デフォルト到達分（分単位）。 */
export const DEFAULT_ISO_MINUTES = [5, 10, 15];

/** デフォルトの移動プロファイル。 */
export const DEFAULT_ISO_PROFILE = "walking" as const;

/** 地図の初期設定 */
// デフォルトの地図中心座標（東京駅）
export const DEFAULT_CENTER = {
  lng: 139.7673068,
  lat: 35.6809591,
} satisfies { lng: number; lat: number };

export const DEFAULT_MAP_CONFIG = {
  style: "streets" as MapboxStyleId, // streets-v11 から streets に変更
  zoom: 15,
  center: DEFAULT_CENTER,
} as const;

/** 言語設定 */
export const LANGUAGE_CONFIG = {
  defaultLanguage: "ja",
} as const;

/** イソクロン（等時線）のデフォルト設定 */
export const DEFAULT_ISOCHRONE_CONFIG = {
  minutes: DEFAULT_ISO_MINUTES,
  profile: DEFAULT_ISO_PROFILE,
  polygons: true,
} as const;
