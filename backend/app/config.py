"""APIの設定と定数"""
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    MLIT_API_KEY: str
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
