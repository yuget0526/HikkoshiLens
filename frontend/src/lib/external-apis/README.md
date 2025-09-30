# 外部 API 管理システム

このディレクトリには、フロントエンドから外部 API に接続するための設定と共通機能が含まれています。

## 構造

```
src/lib/external-apis/
├── base.ts           # 基盤クラス（共通機能）
├── mapbox.ts         # Mapbox API クライアント
├── mlit.ts          # MLIT API クライアント
├── google-maps.ts   # Google Maps API クライアント
├── config.ts        # 設定管理
└── index.ts         # 統合エクスポート
```

## 特徴

1. **統一されたエラーハンドリング**: すべての外部 API で共通のエラー処理
2. **自動リトライ**: 失敗時の指数バックオフリトライ
3. **タイムアウト制御**: API 呼び出しのタイムアウト設定
4. **型安全性**: TypeScript による型定義
5. **設定の一元管理**: 環境変数の管理と検証

## 使用方法

### 1. Mapbox API の使用

```typescript
import { getMapboxClient } from "@/lib/external-apis";

const mapboxClient = getMapboxClient();

// 住所検索
const result = await mapboxClient.geocoding({
  query: "東京駅",
  limit: 5,
  country: "jp",
});

// 逆ジオコーディング
const address = await mapboxClient.reverseGeocoding(139.7673, 35.6809);
```

### 2. MLIT API の使用

```typescript
import { getMlitClient } from "@/lib/external-apis";

const mlitClient = getMlitClient();

// 医療施設データ取得
const facilities = await mlitClient.getMedicalFacilities({
  z: 15,
  x: 29215,
  y: 12870,
});
```

### 3. サービス層の使用（推奨）

```typescript
import { MapboxService } from "@/services/mapbox";
import { MlitService } from "@/services/mlit";

const mapboxService = MapboxService.getInstance();
const mlitService = MlitService.getInstance();

// 駅の検索
const stations = await mapboxService.searchStation("新宿");

// 周辺の医療施設検索
const medical = await mlitService.getMedicalFacilitiesAroundLocation(
  35.6809,
  139.7673,
  15
);
```

## 環境変数

以下の環境変数を設定してください：

```env
# Mapbox
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token

# MLIT
MLIT_SUBSCRIPTION_KEY=your_mlit_key
# または
NEXT_PUBLIC_MLIT_SUBSCRIPTION_KEY=your_mlit_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## API Route Handler での使用

```typescript
// app/api/mapbox/geocoding/route.ts
import { NextRequest } from "next/server";
import { getMapboxClient, ExternalApiError } from "@/lib/external-apis";

export async function GET(req: NextRequest) {
  try {
    const mapboxClient = getMapboxClient();
    const data = await mapboxClient.geocoding({
      query: req.nextUrl.searchParams.get("query") || "",
    });
    return Response.json(data);
  } catch (error) {
    if (error instanceof ExternalApiError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    throw error;
  }
}
```

## エラーハンドリング

すべての外部 API クライアントは`ExternalApiError`をスローします：

```typescript
import { ExternalApiError } from "@/lib/external-apis";

try {
  const result = await mapboxClient.geocoding({ query: "test" });
} catch (error) {
  if (error instanceof ExternalApiError) {
    console.error(`${error.apiName} API Error:`, {
      status: error.status,
      message: error.message,
      data: error.data,
    });
  }
}
```

## 設定の検証

```typescript
import { validateExternalApiConfig } from "@/lib/external-apis/config";

const validation = validateExternalApiConfig();
if (!validation.isValid) {
  console.error("API configuration errors:", validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn("API configuration warnings:", validation.warnings);
}
```
