"""駅情報取得APIのエラー定義"""
from fastapi import HTTPException, status

class MLITAPIError(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(
            status_code=status_code,
            detail=f"国土数値情報APIエラー: {detail}"
        )

class MLITUnauthorizedError(MLITAPIError):
    """APIキー認証エラー"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="APIキーが無効です。"
        )

class MLITBadRequestError(MLITAPIError):
    """リクエストパラメータエラー"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )

class MLITNotFoundError(MLITAPIError):
    """リソース未検出エラー"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定されたリソースが見つかりません。"
        )

class MLITServerError(MLITAPIError):
    """サーバーエラー"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="国土数値情報APIでエラーが発生しました。"
        )
