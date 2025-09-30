from fastapi import APIRouter, HTTPException, Query
import geopandas as gpd
from pathlib import Path

router = APIRouter(
    prefix="/api/stations",
    tags=["stations"]
)

# GeoJSONファイルのパス
STATION_GEOJSON_PATH = Path(__file__).parents[3] / "data/raw/geojson/S12-22_NumberOfPassengers.geojson"

@router.get("/get_coordinates_by_stationid")
async def get_coordinates_by_stationid(
    station_id: str = Query(..., description="駅ID")
):
    try:
        # GeoJSONファイルの読み込み
        gdf = gpd.read_file(STATION_GEOJSON_PATH, encoding='utf-8')

        # 駅IDでフィルタリング
        filtered_gdf = gdf[gdf["S12_001c"] == station_id]

        if len(filtered_gdf) == 0:
            raise HTTPException(
                status_code=404,
                detail="指定された駅IDが見つかりません"
            )

        row = filtered_gdf.iloc[0]
        coordinates = {
            "lng": row.geometry.centroid.x,
            "lat": row.geometry.centroid.y
        }

        return {
            "station_id": station_id,
            "coordinates": coordinates
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