# 国土交通省 人口集中地区（DID）レイヤー

国土交通省の人口集中地区 API を使用した Mapbox レイヤーの実装です。

## 概要

このレイヤーは、国土交通省の不動産情報ライブラリの XKT031 API（人口集中地区データ）を使用して、人口集中地区の境界を地図上に表示します。

## 特徴

- **自動データ取得**: 地図の表示範囲に応じて自動的に API からデータを取得
- **タイルベース**: XYZ 方式のタイル座標を使用した効率的なデータ取得
- **カスタマイズ可能**: 色、透明度、表示/非表示の設定が可能
- **パフォーマンス最適化**: 重複データの除去と更新頻度の制限

## 使用方法

### 1. 基本的な使用方法

```typescript
import { useMLITDIDLayer } from "@/features/map/hooks/useMLITDIDLayer";

function MapComponent() {
  const [map, setMap] = useState<MapboxMap | null>(null);

  const { layer, isLoaded, setVisibility } = useMLITDIDLayer(map, {
    config: {
      visible: true,
      opacity: 0.6,
      fillColor: "#FF6B6B",
      strokeColor: "#CC5555",
    },
  });

  return (
    <div>
      <div ref={mapContainer} style={{ height: "400px" }} />
      {isLoaded && (
        <button onClick={() => setVisibility(false)}>レイヤーを非表示</button>
      )}
    </div>
  );
}
```

### 2. コントロールコンポーネントの使用

```typescript
import { MLITDIDLayerControl } from "@/features/map/components/MLITDIDLayerControl";

function MapWithControls() {
  const [map, setMap] = useState<MapboxMap | null>(null);

  return (
    <div className="flex">
      <div ref={mapContainer} className="flex-1" style={{ height: "600px" }} />
      <div className="w-80 p-4 bg-white shadow-lg">
        <MLITDIDLayerControl map={map} />
      </div>
    </div>
  );
}
```

### 3. レイヤーの直接操作

```typescript
import { MLITDIDLayer } from "@/features/map/layers/mlit-did-layer";

function CustomMapComponent() {
  useEffect(() => {
    if (!map) return;

    const didLayer = new MLITDIDLayer(map, {
      visible: true,
      opacity: 0.8,
      fillColor: "#3498db",
      strokeColor: "#2980b9",
      strokeWidth: 2,
    });

    didLayer.addToMap();

    return () => {
      didLayer.removeFromMap();
    };
  }, [map]);
}
```

## API 仕様

### XKT031 API

- **エンドポイント**: `https://www.reinfolib.mlit.go.jp/ex-api/external/XKT031`
- **レスポンス形式**: GeoJSON
- **ズームレベル**: 9-15
- **座標系**: XYZ 方式

### パラメータ

- `response_format`: レスポンス形式（geojson | pbf）
- `z`: ズームレベル（9-15）
- `x`: タイル X 座標
- `y`: タイル Y 座標
- `administrativeAreaCode`: 行政区域コード（オプション）

## データ構造

### 人口集中地区の属性

- `A16_001`: DID ID
- `A16_002`: 行政区域コード
- `A16_003`: 市区町村名称
- `A16_004`: 人口集中地区符合
- `A16_005`: 人口
- `A16_006`: 面積
- `A16_007`: 前回人口
- `A16_008`: 前回面積
- `A16_009`: 全域に占める人口集中地区の人口割合
- `A16_010`: 全域に占める人口集中地区の面積割合
- `A16_011`: 国勢調査年度
- `A16_012`: 人口（男）
- `A16_013`: 人口（女）
- `A16_014`: 世帯数（総数）

## 注意事項

1. **ズームレベル制限**: API の仕様により、ズームレベル 9-15 でのみデータが取得可能
2. **リクエスト頻度**: 地図の移動時に自動更新されますが、過度な更新を防ぐため更新頻度を制限
3. **データサイズ**: 詳細なズームレベルでは大きなデータが返される可能性があります
4. **行政区域フィルタ**: 特定の行政区域のみを表示したい場合は `administrativeAreaCode` パラメータを使用

## 拡張予定

現在は人口集中地区（XKT031）のみの実装ですが、将来的には以下の API の追加を予定：

- 駅情報 API
- 医療機関 API
- 学校 API
- その他の国土数値情報 API

## ライセンス

このレイヤーで使用するデータは国土交通省の不動産情報ライブラリから取得しており、国土交通省の利用規約に従います。
