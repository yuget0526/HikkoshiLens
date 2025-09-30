from typing import Dict, List, Tuple
from fastapi import APIRouter, Query
from ..utils.xyz_utils import (
    lon_lat_to_xyz,
    xyz_to_tile_center_lon_lat,
)

router = APIRouter(
    prefix="/api/xyz",
    tags=["xyz"]
)

@router.get("/lon-lat-to-xyz")
async def convert_lon_lat_to_xyz(
    lon: float = Query(..., description="経度"),
    lat: float = Query(..., description="緯度"),
    z: int = Query(..., description="ズームレベル")
) -> Dict[str, int]:
    """経度緯度からXYZタイル座標に変換"""
    return lon_lat_to_xyz(lon, lat, z)

@router.get("/tile-center")
async def get_tile_center_lon_lat(
    x: int = Query(..., description="Xタイル座標"),
    y: int = Query(..., description="Yタイル座標"),
    z: int = Query(..., description="ズームレベル")
) -> Dict[str, float]:
    """タイル中心の経度緯度を返す"""
    return xyz_to_tile_center_lon_lat({"x": x, "y": y, "z": z})
