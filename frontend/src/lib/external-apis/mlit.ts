/**
 * 国土交通省（MLIT）API クライアント
 * 人口集中地区（DID）データの取得を担当
 * FastAPIバックエンド経由でデータを取得してCORS問題を回避
 */

import { BaseExternalApiClient } from "./base";

/**
 * 国土交通省 人口集中地区データAPI（XKT031）
 * ズームレベル 9-15 に対応
 *
 * FastAPIバックエンド経由でアクセス:
 * - GET /api/mlit/did: 個別タイル取得
 * - GET /api/mlit/did/bounds: 範囲指定一括取得
 */
export interface MLITDIDParams {
  z: number; // ズームレベル（9-15）
  x: number; // タイルX座標
  y: number; // タイルY座標
  response_format?: "geojson" | "pbf"; // レスポンス形式
  administrative_area_code?: string; // 行政区域コード
}

export interface MLITBoundsParams {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom: number;
  administrative_area_code?: string;
}

/**
 * 人口集中地区データのプロパティ型定義
 */
export interface DIDProperties {
  A16_001: string; // DID_ID（人口集中地区ID）
  A16_002: string; // 整理番号
  A16_003: string; // 市区町村名称
  A16_004: number; // 人口集中地区符合
  A16_005: number; // 人口
  A16_006: number; // 面積（平方メートル）
  A16_007: number; // 前回人口
  A16_008: number; // 前回面積（平方メートル）
  A16_009: number; // 全域に占める人口集中地区の人口割合
  A16_010: number; // 全域に占める人口集中地区の面積割合
  A16_011: number; // 国勢調査年度
  A16_012: number; // 人口（男）
  A16_013: number; // 人口（女）
  A16_014: number; // 世帯数
}

export interface DIDFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties: DIDProperties;
}

export interface DIDResponse {
  type: "FeatureCollection";
  features: DIDFeature[];
}

// レガシー型エイリアス（後方互換性のため）
export type MLITDIDGeoJSON = DIDResponse;

export class MLITApiClient extends BaseExternalApiClient {
  private readonly backendBaseUrl: string;

  constructor() {
    super({
      baseUrl: "",
      timeout: 30000,
      retryCount: 3,
    });
    // FastAPIバックエンドのベースURL
    this.backendBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }

  /**
   * タイル座標を使用して人口集中地区データを取得
   */
  async getDIDData(params: MLITDIDParams): Promise<DIDResponse> {
    const url = `${this.backendBaseUrl}/api/mlit/did`;

    // URLSearchParamsでクエリパラメータを構築
    const searchParams = new URLSearchParams({
      z: params.z.toString(),
      x: params.x.toString(),
      y: params.y.toString(),
      response_format: params.response_format || "geojson",
    });

    if (params.administrative_area_code) {
      searchParams.set(
        "administrative_area_code",
        params.administrative_area_code
      );
    }

    const requestUrl = `${url}?${searchParams.toString()}`;
    console.log("MLIT DID API Request:", requestUrl);

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("MLIT DID API Response:", data);

      return data as DIDResponse;
    } catch (error) {
      console.error("MLIT DID API Error:", error);
      throw error;
    }
  }

  /**
   * 地図の現在位置から適切なタイル座標を計算してDIDデータを取得
   */
  async getDIDDataForMapView(
    center: { lng: number; lat: number },
    zoom: number
  ): Promise<DIDResponse> {
    // バックエンドのXYZ変換APIを使用してタイル座標を取得
    const response = await fetch(
      `${this.backendBaseUrl}/api/xyz/lon-lat-to-xyz?lon=${center.lng}&lat=${
        center.lat
      }&z=${Math.floor(zoom)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to convert coordinates: ${response.statusText}`);
    }

    const tileCoords = await response.json();
    console.log("Converted tile coordinates:", tileCoords);

    // 単一タイルのDIDデータを取得
    return this.getDIDData({
      z: tileCoords.z,
      x: tileCoords.x,
      y: tileCoords.y,
      response_format: "geojson",
    });
  }
  /**
   * ヘルスチェック: MLITプロキシサーバーの状態確認
   */
  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      const response = await fetch(`${this.backendBaseUrl}/api/mlit/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("MLIT Health Check Error:", error);
      return {
        status: "error",
        message: "MLITプロキシサーバーに接続できません",
      };
    }
  }
}

// シングルトンインスタンス
let mlitClientInstance: MLITApiClient | null = null;

/**
 * MLIT APIクライアントのシングルトンインスタンスを取得
 */
export function getMLITClient(): MLITApiClient {
  if (!mlitClientInstance) {
    mlitClientInstance = new MLITApiClient();
  }
  return mlitClientInstance;
}
