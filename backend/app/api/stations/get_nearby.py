from fastapi import APIRouter, Query
from typing import List, Dict
from ...utils.xyz_utils import lon_lat_to_xyz
from ...exceptions.station import (
    MLITUnauthorizedError,
    MLITBadRequestError,
    MLITNotFoundError,
    MLITServerError
)
import requests
import os
from dotenv import load_dotenv
from ...utils.point_to_point_distance import calculate_distance
import logging

# 環境変数の読み込み
load_dotenv()

# ロガーの設定
def setup_logger():
    """
    ロガーを設定する関数
    - ログレベルをDEBUGに設定
    - ログフォーマットを指定
    """
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger

logger = setup_logger()

# 定数
MLIT_API_BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external"
MLIT_API_KEY = os.getenv('MLIT_API_KEY')  # 環境変数からAPIキーを取得

def calculate_center_coordinates(coordinates):
    """
    複数の座標点の中心座標を計算する関数

    Args:
        coordinates (list): [[経度, 緯度], [経度, 緯度], ...] の形式のリスト

    Returns:
        tuple: (中心の経度, 中心の緯度)
    """
    # 座標リストが空の場合はエラーをスロー
    if not coordinates:
        raise ValueError("座標リストが空です。")

    # リストのリストをフラット化
    if isinstance(coordinates[0][0], list):
        coordinates = [coord for sublist in coordinates for coord in sublist]

    # 経度と緯度をそれぞれ分けて平均を計算
    longitudes, latitudes = zip(*coordinates)
    return sum(longitudes) / len(longitudes), sum(latitudes) / len(latitudes)

def handle_mlit_response(response):
    """
    国土数値情報APIのレスポンスを処理する関数

    Args:
        response (requests.Response): APIからのレスポンスオブジェクト

    Returns:
        dict: JSON形式のレスポンスデータ

    Raises:
        MLITUnauthorizedError: 認証エラーの場合
        MLITBadRequestError: リクエストが不正な場合
        MLITNotFoundError: データが見つからない場合
        MLITServerError: サーバーエラーの場合
    """
    # ステータスコードに応じて適切なエラーをスロー
    error_map = {
        401: MLITUnauthorizedError,
        400: lambda: MLITBadRequestError(f"リクエストパラメータが不正です: {response.text}"),
        404: MLITNotFoundError,
    }

    if response.status_code in error_map:
        raise error_map[response.status_code]()
    elif response.status_code >= 500:
        raise MLITServerError()

    # ステータスコードが問題ない場合はJSONレスポンスを返す
    response.raise_for_status()
    return response.json()

def fetch_stations(z: int, x: int, y: int):
    """
    国土数値情報APIから駅データを取得する関数

    Args:
        z (int): ズームレベル
        x (int): タイルのX座標
        y (int): タイルのY座標

    Returns:
        dict: 駅データのJSONレスポンス

    Raises:
        MLITUnauthorizedError: APIキーが設定されていない場合
        MLITServerError: サーバーエラーの場合
    """
    if not MLIT_API_KEY:
        raise MLITUnauthorizedError()

    url = f"{MLIT_API_BASE_URL}/XKT015"
    params = {
        "response_format": "geojson",
        "z": z,
        "x": x,
        "y": y
    }
    headers = {"Ocp-Apim-Subscription-Key": MLIT_API_KEY}

    try:
        # APIリクエストを送信
        response = requests.get(url, params=params, headers=headers)
        return handle_mlit_response(response)
    except requests.RequestException:
        raise MLITServerError()

def process_station_feature(feature, lon, lat, radius):
    """
    駅データの各featureを処理し、必要な情報を抽出する関数

    Args:
        feature (dict): 駅データのGeoJSON feature
        lon (float): 検索中心の経度
        lat (float): 検索中心の緯度
        radius (float): 検索半径（キロメートル）

    Returns:
        dict or None: 駅情報の辞書、または半径外の場合はNone
    """
    try:
        # 駅の座標を取得
        station_coords = feature['geometry']['coordinates']
        station_lon, station_lat = calculate_center_coordinates([station_coords])
    except (TypeError, ValueError, KeyError) as e:
        logger.error(f"Error processing feature: {e}")
        return None

    # 指定された座標との距離を計算
    distance = calculate_distance(lon, lat, station_lon, station_lat)

    # 距離が半径内でない場合はNoneを返す
    if distance > radius:
        return None

    # 駅情報を抽出
    properties = feature['properties']
    return {
        'name': properties.get('S12_001_ja', '不明'),
        'line_name': properties.get('S12_003_ja', '不明'),
        'company': properties.get('S12_002_ja', '不明'),
        'station_code': properties.get('S12_001c', '不明'),
        'coordinates': {'lon': station_lon, 'lat': station_lat},
        'distance_km': round(distance, 2)
    }

router = APIRouter(
    prefix="/api/stations",
    tags=["stations"]
)

@router.get("/get_near_by_coordinates")
async def get_near_by_coordinates(
    lon: float = Query(..., description="経度", ge=-180, le=180),
    lat: float = Query(..., description="緯度", ge=-90, le=90),
    radius: float = Query(2.0, description="検索半径（キロメートル）", ge=0.1, le=10.0)
) -> List[Dict]:
    """
    指定された座標の周辺駅を取得

    Parameters:
    - lon: 経度 (-180 to 180)
    - lat: 緯度 (-90 to 90)
    - radius: 検索半径（キロメートル）、デフォルト2km、最小0.1km、最大10km

    Returns:
    - 駅情報のリスト（距離順にソート済み）
    """
    try:
        # 座標をズームレベル11でXYZタイルに変換
        xyz = lon_lat_to_xyz(lon, lat, 11)

        # 駅データを取得
        station_data = fetch_stations(xyz["z"], xyz["x"], xyz["y"])

        # featuresが存在しない場合は空リストを返す
        if "features" not in station_data:
            logger.warning("No features found in station data.")
            return []

        # 周辺駅をフィルタリング
        nearby_stations = [
            station_info
            for feature in station_data['features']
            if (station_info := process_station_feature(feature, lon, lat, radius))
        ]

        # 距離順にソートして返す
        return sorted(nearby_stations, key=lambda x: x['distance_km'])

    except (TypeError, ValueError) as e:
        logger.error(f"Error during processing: {str(e)}")
        raise MLITBadRequestError(f"座標変換エラー: {str(e)}")

