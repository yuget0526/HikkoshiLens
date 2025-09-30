import { Feature, Point } from "geojson";

export interface MedicalProperties {
  P04_001_name_ja: string; // 医療機関分類名
  P04_002_ja: string; // 施設名称
  P04_003_ja: string; // 所在地
  P04_004: string; // 診療科目1
  distance?: number; // メートル単位の距離
}

export type MedicalFacility = Feature<Point, MedicalProperties>;
