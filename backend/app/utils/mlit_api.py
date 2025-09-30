import requests
import os
from dotenv import load_dotenv
from ..exceptions.station import (
    MLITUnauthorizedError,
    MLITBadRequestError,
    MLITNotFoundError,
    MLITServerError
)

# 環境変数の読み込み
load_dotenv()

# 定数
MLIT_API_BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external"
MLIT_API_KEY = os.getenv('MLIT_API_KEY')

class MLITAPIClient:
    def __init__(self):
        self.session = requests.Session()

    def fetch_stations(self, z: int, x: int, y: int):
        """国土数値情報APIから駅データを取得"""
        url = f"{MLIT_API_BASE_URL}/XKT015"
        params = {
            "response_format": "geojson",
            "z": z,
            "x": x,
            "y": y
        }
        if not MLIT_API_KEY:
            raise MLITUnauthorizedError()

        headers = {
            "Ocp-Apim-Subscription-Key": MLIT_API_KEY
        }

        try:
            response = self.session.get(url, params=params, headers=headers)

            # エラーハンドリング
            if response.status_code == 401:
                raise MLITUnauthorizedError()
            elif response.status_code == 400:
                raise MLITBadRequestError(f"リクエストパラメータが不正です: {response.text}")
            elif response.status_code == 404:
                raise MLITNotFoundError()
            elif response.status_code >= 500:
                raise MLITServerError()

            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            raise MLITServerError()

# シングルトンインスタンスを作成
mlit_api_client = MLITAPIClient()
