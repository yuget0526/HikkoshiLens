/**
 * Mapbox サービス層
 * 外部APIクライアントを使用してMapbox機能を提供
 */

import {
  getMapboxClient,
  type GeocodingParams,
  type GeocodingResponse,
} from "@/lib/external-apis";

export class MapboxService {
  private static instance: MapboxService;

  static getInstance(): MapboxService {
    if (!MapboxService.instance) {
      MapboxService.instance = new MapboxService();
    }
    return MapboxService.instance;
  }

  /**
   * 住所から座標を取得
   */
  async searchAddress(
    query: string,
    options?: Partial<GeocodingParams>
  ): Promise<GeocodingResponse> {
    const client = getMapboxClient();
    return client.geocoding({
      query,
      limit: 5,
      country: "jp",
      ...options,
    });
  }
}
