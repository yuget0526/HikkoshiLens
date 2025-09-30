/**
 * Mapbox レイヤー管理ヘルパー。
 */
import type mapboxgl from "mapbox-gl";

// レイヤーID定義
export const PIN_SOURCE_ID = "location-pin-src";
export const PIN_LAYER_ID = "location-pin-layer";
export const ORIGIN_SOURCE_ID = "iso-origin-src";
export const ORIGIN_LAYER_ID = "iso-origin-layer";

/**
 * 指定した GeoJSON ソースにデータを挿入（なければ作成）。
 * @param map Map インスタンス
 * @param sourceId 対象ソース ID
 * @param data FeatureCollection を想定
 */
export function upsertGeoJSONSource(
  map: mapboxgl.Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection
) {
  const existing = map.getSource(sourceId) as
    | mapboxgl.GeoJSONSource
    | undefined;
  if (existing) {
    existing.setData(data);
  } else {
    map.addSource(sourceId, {
      type: "geojson",
      data,
    });
  }
}

/**
 * ピン表示用レイヤーを保証。
 */
export function ensurePinLayer(map: mapboxgl.Map) {
  if (!map.getSource(PIN_SOURCE_ID)) {
    map.addSource(PIN_SOURCE_ID, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }

  if (!map.getLayer(PIN_LAYER_ID)) {
    map.addLayer({
      id: PIN_LAYER_ID,
      type: "circle",
      source: PIN_SOURCE_ID,
      paint: {
        "circle-radius": 8,
        "circle-color": "#ff0000",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }
}

/**
 * ピンの位置を設定。
 */
export function setPinPosition(map: mapboxgl.Map, lng: number, lat: number) {
  const data: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        properties: {},
      },
    ],
  };
  upsertGeoJSONSource(map, PIN_SOURCE_ID, data);
}

/**
 * 原点表示用レイヤー（circle）を保証。
 */
export function ensureOriginLayer(map: mapboxgl.Map) {
  if (!map.getSource(ORIGIN_SOURCE_ID)) {
    map.addSource(ORIGIN_SOURCE_ID, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });
  }
  if (!map.getLayer(ORIGIN_LAYER_ID)) {
    map.addLayer({
      id: ORIGIN_LAYER_ID,
      type: "circle",
      source: ORIGIN_SOURCE_ID,
      paint: {
        "circle-radius": 6,
        "circle-color": "#ef4444",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });
  }
}

/**
 * 原点ソースの座標を [lng, lat] で更新。
 */
export function setOriginPoint(map: mapboxgl.Map, lng: number, lat: number) {
  const source = map.getSource(ORIGIN_SOURCE_ID) as
    | mapboxgl.GeoJSONSource
    | undefined;
  if (!source) return;
  const feature: GeoJSON.Feature<GeoJSON.Point> = {
    type: "Feature",
    properties: {},
    geometry: { type: "Point", coordinates: [lng, lat] },
  };
  source.setData({ type: "FeatureCollection", features: [feature] });
}
