/**
 * 駅データのAPI クライアント
 * - 駅データの取得
 * - GeoJSON形式への変換
 * - データのフィルタリング
 */

import type { Feature, FeatureCollection, Point } from "geojson";
import type { RawStation, StationBounds, StationQuery } from "./types";
import type { StationProperties } from "./types";
export class StationClient {
  private stationsPromise: Promise<RawStation[]> | null = null;

  constructor() {}

  /**
   * 駅データを取得
   * - 初回のみサーバーからデータを取得
   * - 2回目以降はキャッシュを使用
   */
  private async fetchStations(): Promise<RawStation[]> {
    if (!this.stationsPromise) {
      this.stationsPromise = fetch("/api/stations")
        .then((res) => res.json())
        .then((data) => data as RawStation[]);
    }
    return this.stationsPromise;
  }

  /**
   * 指定された範囲内の駅かどうかをチェック
   */
  private isWithinBounds(station: RawStation, bounds: StationBounds): boolean {
    const [lng, lat] = station.coordinates;
    return (
      lat <= bounds.north &&
      lat >= bounds.south &&
      lng <= bounds.east &&
      lng >= bounds.west
    );
  }

  /**
   * 駅データをGeoJSON形式に変換
   */
  private toGeoJSON(
    stations: RawStation[]
  ): FeatureCollection<Point, StationProperties> {
    const features: Feature<Point, StationProperties>[] = stations.map(
      (station) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: station.coordinates,
        },
        properties: {
          station_name: station.station,
          line_name: station.line,
          company_name: station.company,
        },
      })
    );

    return {
      type: "FeatureCollection",
      features,
    };
  }

  /**
   * クエリに基づいて駅データを取得
   */
  async getStations(
    query?: StationQuery
  ): Promise<FeatureCollection<Point, StationProperties>> {
    const stations = await this.fetchStations();

    let filtered = stations;

    // 地理的範囲でフィルタリング
    if (query?.bounds) {
      filtered = filtered.filter((station) =>
        this.isWithinBounds(station, query.bounds!)
      );
    }

    // 運営会社でフィルタリング
    if (query?.company) {
      filtered = filtered.filter((station) =>
        station.company.includes(query.company!)
      );
    }

    // 路線でフィルタリング
    if (query?.line) {
      filtered = filtered.filter((station) =>
        station.line.includes(query.line!)
      );
    }

    return this.toGeoJSON(filtered);
  }

  /**
   * 指定された駅の詳細情報を取得
   */
  async getStationDetail(stationCode: string): Promise<RawStation | null> {
    const stations = await this.fetchStations();
    return (
      stations.find((station) => station.stationcode === stationCode) || null
    );
  }

  /**
   * 指定された文字列で駅を検索
   */
  async searchStations(query: string): Promise<RawStation[]> {
    const stations = await this.fetchStations();
    const normalizedQuery = query.toLowerCase();

    return stations.filter(
      (station) =>
        station.station.toLowerCase().includes(normalizedQuery) ||
        station.line.toLowerCase().includes(normalizedQuery) ||
        station.company.toLowerCase().includes(normalizedQuery)
    );
  }
}
