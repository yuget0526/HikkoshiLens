from fastapi import FastAPI, HTTPException, BackgroundTasks, APIRouter
from fastapi.middleware.cors import CORSMiddleware
import os

# プロジェクトのルートディレクトリを絶対パスで取得
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# インポートパスをプロジェクトルートからの絶対パスに変更
from .utils.data_trimmer import main as run_data_trimming
from .utils.rent_scraper import main as run_rent_scraping
from .utils.normalization_helper import (
    generate_all_comparison_files,
    generate_company_comparison_files,
    generate_line_comparison_files,
    generate_station_comparison_files
)
from .utils.data_combiner import combine_data_with_normalization
from .api.xyz import router as xyz_router
from .api.stations.get_nearby import router as stations_router
from .api.stations.get_stations_by_line_and_company import router as lines_router
from .api.stations.get_coordinates_by_stationid import router as get_coordinates_by_stationid_router
from .api.mlit.get_did import router as mlit_router

app = FastAPI(
    title="Hikkoshilens API",
    description="Hikkoshilens Backend API"
)

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins="http://localhost:3000",  # フロントエンドのオリジン
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの追加
app.include_router(xyz_router)
app.include_router(stations_router)
app.include_router(lines_router)
app.include_router(get_coordinates_by_stationid_router) 
app.include_router(mlit_router)


# --- データ準備・加工系エンドポイント ---

@app.post("/run-scraping", tags=["Data Preparation"])
async def run_scraping_endpoint(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_rent_scraping)
    return {"message": "Rent scraping task has been started."}

@app.post("/run-data-trimming/{data_name}", tags=["Data Preparation"])
async def process_data_endpoint(data_name: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_data_trimming, data_name)
    return {"message": f"Data trimming for '{data_name}' has been started."}

@app.post("/run-data-combination", tags=["Data Preparation"])
async def run_data_combination_endpoint(background_tasks: BackgroundTasks):
    background_tasks.add_task(
        combine_data_with_normalization,
        main_data_path=os.path.join(PROJECT_ROOT, 'data/processed/stationcode.json'),
        lookup_data_path=os.path.join(PROJECT_ROOT, 'data/processed/rent_marketprice.json'),
        output_path=os.path.join(PROJECT_ROOT, 'data/processed/combined_station_data.json')
    )
    return {"message": "Data combination task has been started."}

# --- 正規化ヘルパーのエンドポイント ---

# APIRouterを作成してエンドポイントをグループ化
router_normalization = APIRouter(
    prefix="/normalization_helper",
    tags=["Normalization Helper"],
)

@router_normalization.post("/all", summary="全比較ファイルの生成")
async def run_all_normalization_helper(background_tasks: BackgroundTasks):
    """全てのレベル（会社、路線、駅）の比較ファイルを生成します。"""
    background_tasks.add_task(
        generate_all_comparison_files,
        main_data_path=os.path.join(PROJECT_ROOT, 'data/processed/stationcode.json'),
        lookup_data_path=os.path.join(PROJECT_ROOT, 'data/processed/rent_marketprice.json'),
        output_dir=os.path.join(PROJECT_ROOT, 'data/processed/normalization_comparison')
    )
    return {"message": "All normalization comparison file generation has been started."}

@router_normalization.post("/company", summary="会社名比較ファイルの生成")
async def run_company_normalization_helper(background_tasks: BackgroundTasks):
    """会社名の比較ファイルを生成します。"""
    background_tasks.add_task(
        generate_company_comparison_files,
        main_data_path=os.path.join(PROJECT_ROOT, 'data/processed/stationcode.json'),
        lookup_data_path=os.path.join(PROJECT_ROOT, 'data/processed/rent_marketprice.json'),
        output_dir=os.path.join(PROJECT_ROOT, 'data/processed/normalization_comparison')
    )
    return {"message": "Company name comparison file generation has been started."}

@router_normalization.post("/line", summary="路線名比較ファイルの生成")
async def run_line_normalization_helper(background_tasks: BackgroundTasks):
    """路線名の比較ファイルを生成します（会社名正規化後）。"""
    background_tasks.add_task(
        generate_line_comparison_files,
        main_data_path=os.path.join(PROJECT_ROOT, 'data/processed/stationcode.json'),
        lookup_data_path=os.path.join(PROJECT_ROOT, 'data/processed/rent_marketprice.json'),
        output_dir=os.path.join(PROJECT_ROOT, 'data/processed/normalization_comparison')
    )
    return {"message": "Line name comparison file generation has been started."}

@router_normalization.post("/station", summary="駅名比較ファイルの生成")
async def run_station_normalization_helper(background_tasks: BackgroundTasks):
    """駅名の比較ファイルを生成します（会社名・路線名正規化後）。"""
    background_tasks.add_task(
        generate_station_comparison_files,
        main_data_path=os.path.join(PROJECT_ROOT, 'data/processed/stationcode.json'),
        lookup_data_path=os.path.join(PROJECT_ROOT, 'data/processed/rent_marketprice.json'),
        output_dir=os.path.join(PROJECT_ROOT, 'data/processed/normalization_comparison')
    )
    return {"message": "Station name comparison file generation has been started."}

# ルーターをアプリケーションに登録
app.include_router(router_normalization)

# アプリケーションの起動方法 (開発用):
# ターミナルでプロジェクトルートから以下を実行:
# uvicorn backend.app.main:app --reload 