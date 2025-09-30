import type mapboxgl from "mapbox-gl";

/**
 * 同一 URL への再設定を避けるスタイル適用ヘルパー。
 * スタイル切替後に 1 回だけ与えられたコールバックを呼びます。
 */
export function applyStyleIfChanged(
  map: mapboxgl.Map,
  nextStyle: string,
  options: {
    onStyleLoaded?: () => void;
    currentRef: { current: string | null };
  }
) {
  if (options.currentRef.current === nextStyle) return;
  options.currentRef.current = nextStyle;
  map.setStyle(nextStyle);
  if (options.onStyleLoaded) {
    map.once("style.load", options.onStyleLoaded);
  }
}
