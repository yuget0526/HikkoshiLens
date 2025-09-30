/**
 * Common types for the application
 */

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Drop {
  id: string;
  user_id: string;
  emoji: string;
  message?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  user?: User;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  drop_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: User;
}

export interface EmojiTag {
  id: string;
  name: string;
  emoji: string;
  description?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface Station {
  name: string;
  line_name: string;
  company: string;
  station_code: string;
  status: {
    is_valid: boolean;
    is_primary: boolean;
    duplicate_code: string;
    data_availability: string;
  };
  passengers: {
    2020: number | null;
    2021: number | null;
    2022: number | null;
  };
  coordinates: {
    lon: number;
    lat: number;
  };
  distance_km: number;
}

export interface Line {
  id: string;
  company: string;
  line_name: string;
  stations: Station[];
}
