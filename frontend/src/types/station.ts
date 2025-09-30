export interface Coordinates {
  lat: number;
  lng: number;
  lon?: number;
}

export interface Station {
  station_code: string;
  name: string;
  line_name: string;
  company: string;
  coordinates: Coordinates;
  distance_km?: number;
}

export interface Line {
  id: string;
  company: string;
  line_name: string;
  stations: Station[];
}
