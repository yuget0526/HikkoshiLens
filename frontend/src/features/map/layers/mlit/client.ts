/**
 * 国土交通省人口集中地区（DID）レイヤー用のAPIクライアント
 * - 地図の表示範囲に応じて人口集中地区データを取得
 * - データの正規化とキャッシュ機能
 */

import { getMLITClient, type MLITDIDGeoJSON } from "@/lib/external-apis/mlit";

export class MLITDIDLayerClient {
  private cache = new Map<string, MLITDIDGeoJSON>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分

  /**
   * 地図の中心位置から人口集中地区データを取得（キャッシュ機能付き）
   */
  async getDIDDataForMapView(
    center: { lng: number; lat: number },
    zoom: number
  ): Promise<MLITDIDGeoJSON> {
    const cacheKey = this.generateCacheKeyForView(center, zoom);

    // キャッシュから取得を試行
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const client = getMLITClient();

      // デバッグログ
      console.log("MLIT Client center:", center);
      console.log("MLIT Client zoom:", zoom);

      const data = await client.getDIDDataForMapView(center, zoom);

      // データを正規化
      const normalizedData = this.normalizeDIDData(data);

      // キャッシュに保存
      this.setCache(cacheKey, normalizedData);

      return normalizedData;
    } catch (error) {
      console.error("Failed to fetch MLIT DID data:", error);
      throw error;
    }
  }

  /**
   * データの正規化処理
   */
  private normalizeDIDData(data: MLITDIDGeoJSON): MLITDIDGeoJSON {
    return {
      type: "FeatureCollection",
      features: data.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          // 市区町村名称の正規化
          A16_003: feature.properties.A16_003?.trim() || "不明",
          // 数値データの正規化（0以下の場合は0にする）
          A16_005: Math.max(0, feature.properties.A16_005 || 0), // 人口
          A16_006: Math.max(0, feature.properties.A16_006 || 0), // 面積
          A16_007: Math.max(0, feature.properties.A16_007 || 0), // 前回人口
          A16_008: Math.max(0, feature.properties.A16_008 || 0), // 前回面積
          A16_012: Math.max(0, feature.properties.A16_012 || 0), // 人口（男）
          A16_013: Math.max(0, feature.properties.A16_013 || 0), // 人口（女）
          A16_014: Math.max(0, feature.properties.A16_014 || 0), // 世帯数
        },
      })),
    };
  }

  /**
   * キャッシュキーを生成
   */
  private generateCacheKey(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    zoom: number
  ): string {
    return `${bounds.north.toFixed(4)},${bounds.south.toFixed(
      4
    )},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)},${zoom}`;
  }

  /**
   * 地図ビュー用のキャッシュキーを生成
   */
  private generateCacheKeyForView(
    center: { lng: number; lat: number },
    zoom: number
  ): string {
    const precision = 4; // 小数点以下4桁で丸める
    const roundedLng = Number(center.lng.toFixed(precision));
    const roundedLat = Number(center.lat.toFixed(precision));
    const roundedZoom = Math.floor(zoom);

    return `view_${roundedLng}_${roundedLat}_${roundedZoom}`;
  }

  /**
   * キャッシュから取得
   */
  private getFromCache(key: string): MLITDIDGeoJSON | null {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  /**
   * キャッシュに保存
   */
  private setCache(key: string, data: MLITDIDGeoJSON): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// シングルトンインスタンス
let didClient: MLITDIDLayerClient | null = null;

export function getMLITDIDLayerClient(): MLITDIDLayerClient {
  if (!didClient) {
    didClient = new MLITDIDLayerClient();
  }
  return didClient;
}
