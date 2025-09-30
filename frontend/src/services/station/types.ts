/**
 * 駅データの型定義
 * - APIレスポンスの型
 * - データ変換用の型
 */

export interface RawStation {
  company: string; // 運営会社名
  line: string; // 路線名
  station: string; // 駅名
  stationcode: string; // 駅コード
  coordinates: [number, number]; // 経度,緯度
}

export interface StationPassengers {
  stationcode: string; // 駅コード
  passengers: number; // 1日あたりの乗降客数
}

export interface StationBounds {
  north: number; // 北緯
  south: number; // 南緯
  east: number; // 東経
  west: number; // 西経
}

export interface StationQuery {
  bounds?: StationBounds; // 地理的な範囲
  company?: string; // 運営会社での絞り込み
  line?: string; // 路線での絞り込み
  minPassengers?: number; // 最小乗降客数
}

export interface StationProperties {
  station_name: string;
  line_name: string;
  company_name: string;
}
