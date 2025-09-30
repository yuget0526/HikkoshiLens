"""
国土交通省（MLIT）APIのプロキシエンドポイント
人口集中地区（DID）データなどの国土数値情報を取得
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any
import httpx
import logging
import os
from dotenv import load_dotenv

# 環境変数を読み込み
load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/mlit",
    tags=["MLIT"],
    responses={404: {"description": "Not found"}},
)

# 国土交通省APIの設定
MLIT_BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external"
MLIT_API_KEY = os.getenv("MLIT_API_KEY")


@router.get("/did", summary="人口集中地区（DID）データの取得")
async def get_did_data(
    z: int = Query(..., description="ズームレベル（9-15、範囲外は自動調整）"),
    x: int = Query(..., description="タイルX座標"),
    y: int = Query(..., description="タイルY座標"),
    response_format: str = Query("geojson", description="レスポンス形式"),
    administrative_area_code: Optional[str] = Query(None, description="行政区域コード（5桁、カンマ区切り）", alias="administrativeAreaCode")
) -> Dict[str, Any]:
    """
    国土交通省APIから人口集中地区（DID）データを取得します。
    
    パラメータ:
    - z: ズームレベル（9-15、範囲外の値は自動的に9-15の範囲に調整されます）
    - x: タイルX座標
    - y: タイルY座標
    - response_format: レスポンス形式（デフォルト: geojson）
    - administrative_area_code: 行政区域コード（オプション）
    
    戻り値:
    - GeoJSONまたはPBF形式の人口集中地区データ
    """
    
    try:
        # ズームレベルを9-15の範囲に調整
        original_z = z
        z = max(9, min(15, z))
        
        if original_z != z:
            logger.info(f"Zoom level adjusted from {original_z} to {z}")
        
        # タイル座標の妥当性をチェック
        max_tile_coord = 2 ** z - 1
        if x < 0 or x > max_tile_coord or y < 0 or y > max_tile_coord:
            logger.warning(f"Tile coordinates out of range for zoom {z}: x={x}, y={y}, max={max_tile_coord}")
            # タイル座標を範囲内に調整
            x = max(0, min(max_tile_coord, x))
            y = max(0, min(max_tile_coord, y))
            logger.info(f"Adjusted tile coordinates to: x={x}, y={y}")
        
        # パラメータの構築
        params = {
            "response_format": response_format,
            "z": z,
            "x": x,
            "y": y
        }
        
        if administrative_area_code:
            params["administrativeAreaCode"] = administrative_area_code
        
        # 国土交通省APIへのリクエスト
        api_url = f"{MLIT_BASE_URL}/XKT031"
        
        # ヘッダーを設定
        headers = {}
        if MLIT_API_KEY:
            headers["Ocp-Apim-Subscription-Key"] = MLIT_API_KEY
        
        logger.info(f"Requesting MLIT API: {api_url} with params: {params} and headers: {list(headers.keys())}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(api_url, params=params, headers=headers)
            
            # レスポンスの詳細をログ出力
            logger.info(f"MLIT API response status: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"MLIT API error response: {response.text}")
            
            response.raise_for_status()
            
            # レスポンスの形式に応じて処理
            if response_format == "geojson":
                return response.json()
            else:
                # PBF形式の場合はバイナリデータをそのまま返す
                return {"data": response.content.hex()}
                
    except httpx.TimeoutException:
        logger.error(f"Timeout when requesting MLIT API: {api_url}")
        raise HTTPException(status_code=504, detail="国土交通省APIへのリクエストがタイムアウトしました")
    
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error when requesting MLIT API: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"国土交通省APIエラー: {e.response.status_code}"
        )
    
    except Exception as e:
        logger.error(f"Unexpected error when requesting MLIT API: {str(e)}")
        raise HTTPException(status_code=500, detail=f"内部サーバーエラー: {str(e)}")