/**
 * Mapbox GL JS の初期化ユーティリティ。
 * - 日本語ラベル化（@mapbox/mapbox-gl-language）を適用
 * - 呼び出し側は返却された Map インスタンスを使ってレイヤー等を構築
 */
import mapboxgl from "mapbox-gl";
import MapboxLanguage from "@mapbox/mapbox-gl-language";

/**
 * Mapbox GL JS の地図を生成し、日本語言語コントロールを適用する初期化関数。
 * 初回の style.load で一度だけ明示的に日本語を設定し、その後はコントロールに委ねます。
 */
export function createMapWithLanguage(
  container: HTMLDivElement,
  initialStyle: string
): mapboxgl.Map {
  const map = new mapboxgl.Map({
    container,
    style: initialStyle,
    center: [139.7670516, 35.6811673],
    zoom: 15,
  });

  const language = new MapboxLanguage({ defaultLanguage: "ja" });
  map.addControl(language);

  // 自動ログは行わず、必要時に UI 側から取得する方針

  // 初回のスタイルロードで一度だけ日本語を明示設定
  let applied = false;
  map.once("style.load", () => {
    if (!applied) {
      try {
        (
          language as unknown as { setLanguage?: (lang: string) => void }
        )?.setLanguage?.("ja");
      } catch {
        // noop
      }
      applied = true;
    }
  });

  return map;
}
