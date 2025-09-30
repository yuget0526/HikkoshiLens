/**
 * Mapbox API クライアント
 * ジオコーディング、逆ジオコーディングなどの機能を提供
 */

import { BaseExternalApiClient, type ApiConfig } from "./base";

export interface GeocodingParams {
  query: string;
  limit?: number;
  country?: string;
  types?: string;
  proximity?: [number, number]; // [longitude, latitude]
}

export interface GeocodingFeature {
  id: string;
  type: "Feature";
  place_type: string[];
  relevance: number;
  properties: {
    facility_name?: string;
    address?: string;
    tel?: string;
    [key: string]: unknown;
  };
  text: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

export interface GeocodingResponse {
  type: "FeatureCollection";
  query: string[];
  features: GeocodingFeature[];
  attribution: string;
}

export class MapboxApiClient extends BaseExternalApiClient {
  constructor(accessToken: string) {
    const config: ApiConfig = {
      baseUrl: "https://api.mapbox.com",
      apiKey: accessToken,
      defaultHeaders: {},
    };
    super(config);
  }

  /**
   * 住所から座標を取得（ジオコーディング）
   */
  async geocoding(params: GeocodingParams): Promise<GeocodingResponse> {
    const { query, limit = 5, country = "jp", types, proximity } = params;

    const searchParams: Record<string, string> = {
      access_token: this.config.apiKey!,
      limit: limit.toString(),
      country,
    };

    if (types) {
      searchParams.types = types;
    }

    if (proximity) {
      searchParams.proximity = proximity.join(",");
    }

    // 正しいMapbox APIのURLを構築
    const baseUrl = `${
      this.config.baseUrl
    }/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
    const url = this.buildUrl(baseUrl, searchParams);

    return this.request<GeocodingResponse>(url);
  }
}

// シングルトンインスタンス
let mapboxClient: MapboxApiClient | null = null;

export function getMapboxClient(): MapboxApiClient {
  if (!mapboxClient) {
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Mapbox access token not configured");
    }
    mapboxClient = new MapboxApiClient(accessToken);
  }
  return mapboxClient;
}
