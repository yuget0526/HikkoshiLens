/**
 * Application constants
 */

export const APP_CONFIG = {
  name: "EmotiDrop",
  description: "Drop your emotions on the map",
  version: "1.0.0",
} as const;

export const API_ENDPOINTS = {
  USERS: "/users",
  DROPS: "/drops",
  REACTIONS: "/reactions",
  EMOJIS: "/emojis",
} as const;

export const ROUTES = {
  HOME: "/",
  MAP: "/map",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;

export const DEFAULT_COORDINATES = {
  latitude: 35.6762,
  longitude: 139.6503,
} as const;
