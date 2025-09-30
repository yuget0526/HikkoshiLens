/**
 * 外部APIクライアントの統合エクスポート
 */

export * from "./base";
export * from "./mapbox";

// すべてのクライアントを一括で取得するヘルパー
export function getAllExternalApiClients() {
  return {
    mapbox: () => import("./mapbox").then((m) => m.getMapboxClient()),
  };
}
