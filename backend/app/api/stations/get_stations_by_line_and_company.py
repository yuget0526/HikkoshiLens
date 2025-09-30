from fastapi import APIRouter, HTTPException, Query
import geopandas as gpd
from pathlib import Path

router = APIRouter(
    prefix="/api/stations",
    tags=["stations"]
)

# GeoJSONファイルのパス
STATION_GEOJSON_PATH = Path(__file__).parents[3] / "data/raw/geojson/S12-22_NumberOfPassengers.geojson"

@router.get("/get_stations_by_line_and_company")
async def get_stations_by_line_and_company(
    line_name: str = Query(..., description="路線名"),
    company: str = Query(..., description="運営会社名")
):
    try:
        # GeoJSONファイルの読み込み
        gdf = gpd.read_file(STATION_GEOJSON_PATH, encoding='utf-8')

        # 路線名と運営会社でフィルタリング
        filtered_gdf = gdf[
            (gdf["S12_003"] == line_name) &
            (gdf["S12_002"] == company)
        ]

        if len(filtered_gdf) == 0:
            raise HTTPException(
                status_code=404,
                detail="指定された路線名と運営会社の組み合わせが見つかりません"
            )

        # 必要な情報を抽出
        stations = [{
            "station_code": str(row["S12_001c"]),
            "name": row["S12_001"],
            "line_name": row["S12_003"],
            "company": row["S12_002"],
            "coordinates": {
                "lng": row.geometry.centroid.x,
                "lat": row.geometry.centroid.y
            }
        } for _, row in filtered_gdf.iterrows()]

        return {
            "stations": stations,
            "total": len(stations)
        }

    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="GeoJSONファイルが見つかりません"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"エラーが発生しました: {str(e)}"
        )
