/**
 * 現在の Map インスタンスを UI から参照するためのレジストリ。
 * 単一ページ内に 1 マップ想定のためシンプルな実装。
 */
import type mapboxgl from "mapbox-gl";

export const CurrentMapRegistry: {
  instance: mapboxgl.Map | null;
} = {
  instance: null,
};
