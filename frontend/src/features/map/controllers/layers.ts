/**
 * レイヤー制御用のコントローラ関数群。
 * - Header など UI から呼び出して、Map 操作やデータ取得をまとめて実行する。
 */
import { getCenterXYZ, getViewportXYZTiles } from "../utils/xyz";

export function clampZoomForMlit(zoom: number): number {
  return Math.min(15, Math.max(13, Math.floor(zoom)));
}

export function getClampedCenterXYZ(map: mapboxgl.Map): {
  z: number;
  x: number;
  y: number;
} {
  const z = clampZoomForMlit(map.getZoom());
  const center = getCenterXYZ(map, z);
  return { z, x: center.x, y: center.y };
}

export function logViewportXYZ(map: mapboxgl.Map) {
  const z = clampZoomForMlit(map.getZoom());
  const center = getCenterXYZ(map, z);
  const tiles = getViewportXYZTiles(map, z);
  // eslint-disable-next-line no-console
  console.log("[map][xyz] (manual)", {
    z: center.z,
    x: center.x,
    y: center.y,
    tiles: tiles.length,
  });
}
