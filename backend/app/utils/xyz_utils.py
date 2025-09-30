"""
XYZタイル座標ユーティリティモジュール
- 経度緯度↔XYZ 変換
- タイル境界計算
"""
import math
from typing import Dict, List, Tuple

class XYZCoordinate:
    def __init__(self, z: int, x: int, y: int):
        self.z = z
        self.x = x
        self.y = y

def lon_lat_to_xyz(lon: float, lat: float, z: int) -> Dict[str, int]:
    """経度緯度からXYZタイル座標に変換"""
    n = 2 ** z
    x = math.floor(((lon + 180) / 360) * n)
    lat_rad = (lat * math.pi) / 180
    y = math.floor(
        ((1 - math.log(math.tan(lat_rad) + 1 / math.cos(lat_rad)) / math.pi) / 2) * n
    )
    return {"z": z, "x": x, "y": y}

def xyz_to_top_left_lon_lat(xyz: Dict[str, int]) -> Dict[str, float]:
    """タイル左上の経度緯度を返す（lon/lat）"""
    n = 2 ** xyz["z"]
    lon = (xyz["x"] / n) * 360 - 180
    lat_rad = math.atan(math.sinh(math.pi * (1 - (2 * xyz["y"]) / n)))
    lat = (lat_rad * 180) / math.pi
    return {"lon": lon, "lat": lat}

def xyz_to_bbox(xyz: Dict[str, int]) -> Tuple[float, float, float, float]:
    """タイルのバウンディングボックス [west, south, east, north]（lon/lat）を返す"""
    west_north = xyz_to_top_left_lon_lat(xyz)
    east_south = xyz_to_top_left_lon_lat({
        "x": xyz["x"] + 1,
        "y": xyz["y"] + 1,
        "z": xyz["z"]
    })
    return (west_north["lon"], east_south["lat"], east_south["lon"], west_north["lat"])

def xyz_to_tile_center_lon_lat(xyz: Dict[str, int]) -> Dict[str, float]:
    """タイル中心の経度緯度を返す（lon/lat）"""
    n = 2 ** xyz["z"]
    lon = ((xyz["x"] + 0.5) / n) * 360 - 180
    lat_rad = math.atan(math.sinh(math.pi * (1 - (2 * (xyz["y"] + 0.5)) / n)))
    lat = (lat_rad * 180) / math.pi
    return {"lon": lon, "lat": lat}

def normalize_lon(lon: float) -> float:
    """経度を-180から180の範囲に正規化"""
    v = lon
    while v < -180:
        v += 360
    while v > 180:
        v -= 360
    return v
