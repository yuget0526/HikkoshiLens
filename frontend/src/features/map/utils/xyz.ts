/**
 * XYZ タイル座標ユーティリティ。
 * - 経度緯度↔XYZ 変換
 * - タイル境界計算
 * - 表示範囲内のタイル列挙
 */
import type mapboxgl from "mapbox-gl";

export type XYZ = {
  z: number;
  x: number;
  y: number;
};

/**
 * 経度緯度→XYZ（Web Mercator／XYZ タイル座標）
 */
export function lonLatToXYZ(lon: number, lat: number, z: number): XYZ {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { z, x, y };
}

/**
 * タイル左上の経度緯度を返す（lon/lat）
 */
export function xyzToTopLeftLonLat({ x, y, z }: XYZ): {
  lon: number;
  lat: number;
} {
  const n = 2 ** z;
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lon, lat };
}

/**
 * タイルのバウンディングボックス [west, south, east, north]（lon/lat）
 */
export function xyzToBBox({ x, y, z }: XYZ): [number, number, number, number] {
  const { lon: west, lat: north } = xyzToTopLeftLonLat({ x, y, z });
  const { lon: east, lat: south } = xyzToTopLeftLonLat({
    x: x + 1,
    y: y + 1,
    z,
  });
  return [west, south, east, north];
}

/**
 * タイル中心の経度緯度を返す（lon/lat）
 */
export function xyzToTileCenterLonLat({ x, y, z }: XYZ): {
  lon: number;
  lat: number;
} {
  const n = 2 ** z;
  const lon = ((x + 0.5) / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lon, lat };
}

/**
 * マップ中心点のタイル（ズームは指定が無ければ現在の整数ズーム）
 */
export function getCenterXYZ(map: mapboxgl.Map, z?: number): XYZ {
  const zoom = z ?? Math.floor(map.getZoom());
  const c = map.getCenter();
  return lonLatToXYZ(c.lng, c.lat, zoom);
}

function normalizeLon(lon: number): number {
  let v = lon;
  while (v < -180) v += 360;
  while (v > 180) v -= 360;
  return v;
}

/**
 * 表示範囲を覆う XYZ タイル一覧（ズームは指定が無ければ現在の整数ズーム）
 * アンチメリディアン跨ぎも考慮。
 */
export function getViewportXYZTiles(map: mapboxgl.Map, z?: number): XYZ[] {
  const zoom = z ?? Math.floor(map.getZoom());
  const b = map.getBounds() as mapboxgl.LngLatBounds;
  const west = b.getWest();
  let east = b.getEast();
  const south = b.getSouth();
  const north = b.getNorth();

  // アンチメリディアン跨ぎ（east < west）の場合に east を +360 して扱う
  const crossesAntimeridian = east < west;
  if (crossesAntimeridian) {
    east += 360;
  }

  // 緯度経度を XYZ に変換し、範囲をループ
  const sw = lonLatToXYZ(normalizeLon(west), south, zoom);
  const ne = lonLatToXYZ(normalizeLon(east), north, zoom);

  const tiles: XYZ[] = [];
  const minX = Math.min(sw.x, ne.x);
  const maxX = Math.max(sw.x, ne.x);
  const minY = Math.min(ne.y, sw.y);
  const maxY = Math.max(ne.y, sw.y);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ z: zoom, x, y });
    }
  }

  // アンチメリディアン跨ぎ時は x を 2^z で wrap
  if (crossesAntimeridian) {
    const n = 2 ** zoom;
    for (let i = 0; i < tiles.length; i++) {
      tiles[i] = { ...tiles[i], x: ((tiles[i].x % n) + n) % n };
    }
  }

  return tiles;
}
