import { type MapboxStyleId } from "@/constants/mapbox";

/** デフォルト到達分（分単位）。 */
export const DEFAULT_ISO_MINUTES = [5, 10, 15];

/** デフォルトの移動プロファイル。 */
export const DEFAULT_ISO_PROFILE = "walking" as const;

/** 神戸市の中心座標 */
export const KOBE_CENTER = {
  lng: 135.1955,
  lat: 34.6937,
} as const;

/** 地図の初期設定 */
export const DEFAULT_MAP_CONFIG = {
  zoom: 12,
  center: [KOBE_CENTER.lng, KOBE_CENTER.lat] as [number, number],
  style: "streets" as MapboxStyleId,
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
