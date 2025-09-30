import math

def calculate_distance(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """2点間の距離をキロメートルで計算（ヒュベニの公式）"""
    radius = 6371  # 地球の半径(km)

    # ラジアンに変換
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # 緯度差、経度差
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    # ヒュベニの公式
    a = (math.sin(dlat / 2))**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * (math.sin(dlon / 2))**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c
