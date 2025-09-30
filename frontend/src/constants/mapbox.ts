export type ThemeMode = "light" | "dark" | undefined;

export type MapboxStyle = string | { light: string; dark: string };

export type MapboxStyleId =
  | "streets"
  | "outdoors"
  | "satellite"
  | "lightDark"
  | "navigation";

export const MAPBOX_STYLES: Record<MapboxStyleId, MapboxStyle> = {
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  lightDark: {
    light: "mapbox://styles/mapbox/light-v11",
    dark: "mapbox://styles/mapbox/dark-v11",
  },
  navigation: {
    light: "mapbox://styles/mapbox/navigation-day-v1",
    dark: "mapbox://styles/mapbox/navigation-night-v1",
  },
};

export function resolveMapboxStyle(
  style: MapboxStyle,
  theme: ThemeMode
): string {
  if (typeof style === "string") {
    return style;
  }
  return theme === "dark" ? style.dark : style.light;
}

export const DEFAULT_MAPBOX_STYLE_ID: MapboxStyleId = "streets";
