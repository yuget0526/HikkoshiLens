from pydantic import BaseModel
from typing import Optional, List

class MLITStationResponse(BaseModel):
    """国土数値情報APIのレスポンス型"""
    type: str
    features: List[dict]
