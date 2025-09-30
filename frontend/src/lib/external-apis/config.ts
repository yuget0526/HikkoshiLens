/**
 * 外部API設定の管理
 * 環境変数の検証と設定を提供
 */

export interface ExternalApiConfig {
  mapbox: {
    accessToken: string;
    isEnabled: boolean;
  };
}

export function getExternalApiConfig(): ExternalApiConfig {
  return {
    mapbox: {
      accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
      isEnabled: Boolean(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN),
    },
  };
}

export function validateExternalApiConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const config = getExternalApiConfig();
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須のAPI設定をチェック
  if (!config.mapbox.isEnabled) {
    warnings.push("Mapbox API token is not configured");
  }

  // すべてのAPIが無効な場合はエラー
  if (!config.mapbox.isEnabled) {
    errors.push("No external API credentials are configured");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export const externalApiConfig = getExternalApiConfig();
