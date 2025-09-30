import { LngLat } from "mapbox-gl";

/**
 * 2点間の距離をメートル単位で計算する
 */
export function calculateDistance(
  point1: LngLat | [number, number],
  point2: LngLat | [number, number]
): number {
  const lat1 = Array.isArray(point1) ? point1[1] : point1.lat;
  const lon1 = Array.isArray(point1) ? point1[0] : point1.lng;
  const lat2 = Array.isArray(point2) ? point2[1] : point2.lat;
  const lon2 = Array.isArray(point2) ? point2[0] : point2.lng;

  const R = 6371e3; // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // メートル単位の距離を返す
}

/**
 * メートル単位の距離を人間が読みやすい形式に変換する
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
