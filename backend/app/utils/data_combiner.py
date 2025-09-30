import pandas as pd
import logging
import os

# normalization_helperから正規化関連の関数とテーブルをインポート
from .normalization_helper import (
    preprocess_data, 
    apply_normalization_mapping, 
    COMPANY_MAPPING_TABLE, 
    LINE_MAPPING_TABLE
)

# ロギングの基本設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def combine_data_with_normalization(
    main_data_path: str,
    lookup_data_path: str,
    output_path: str
):
    """
    正規化テーブルを用いて2つのデータソースを結合し、結果を保存します。
    """
    logger.info("正規化テーブルを用いたデータ結合を開始します。")

    common_keys = ['company', 'line', 'station']

    logger.info("データの読み込みと前処理を開始します...")
    df_main = preprocess_data(main_data_path, common_keys)
    df_lookup = preprocess_data(lookup_data_path, common_keys)

    if df_main.empty or df_lookup.empty:
        logger.error("データの前処理に失敗したため、結合処理を中止します。")
        return

    logger.info("正規化マッピングを適用します...")
    df_main_normalized = apply_normalization_mapping(df_main, COMPANY_MAPPING_TABLE, LINE_MAPPING_TABLE)
    df_lookup_normalized = apply_normalization_mapping(df_lookup, COMPANY_MAPPING_TABLE, LINE_MAPPING_TABLE)

    logger.info("データの結合処理を開始します...")
    merge_keys = [f'norm_{key}' for key in common_keys]
    
    df_combined = pd.merge(
        df_main_normalized,
        df_lookup_normalized,
        on=merge_keys,
        how='left',
        suffixes=('_main', '_lookup')
    )
    
    logger.info(f"結合後のデータ件数: {len(df_combined)}件")
    
    try:
        output_dir = os.path.dirname(output_path)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        df_combined.to_json(output_path, orient='records', force_ascii=False, indent=4)
        logger.info(f"結合済みデータを '{output_path}' に正常に保存しました。")
    except Exception as e:
        logger.error(f"ファイルへの保存中にエラーが発生しました: {e}")

if __name__ == '__main__':
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    MAIN_DATA_PATH = os.path.join(PROJECT_ROOT, 'data/processed/stationcode.json')
    LOOKUP_DATA_PATH = os.path.join(PROJECT_ROOT, 'data/processed/rent_marketprice.json')
    OUTPUT_PATH = os.path.join(PROJECT_ROOT, 'data/processed/combined_station_data.json')

    logger.info(f"入力ファイル: {MAIN_DATA_PATH}, {LOOKUP_DATA_PATH}")
    logger.info(f"出力ファイル: {OUTPUT_PATH}")

    combine_data_with_normalization(
        main_data_path=MAIN_DATA_PATH,
        lookup_data_path=LOOKUP_DATA_PATH,
        output_path=OUTPUT_PATH
    ) 