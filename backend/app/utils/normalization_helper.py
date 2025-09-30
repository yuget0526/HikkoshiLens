import pandas as pd
import logging
import mojimoji
import os

# ロギングの基本設定
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- 正規化テーブルの定義 ---
COMPANY_MAPPING_TABLE = {
    # JR系
    "北海道旅客鉄道": "jr", "東日本旅客鉄道": "jr", "東海旅客鉄道": "jr", "西日本旅客鉄道": "jr", "四国旅客鉄道": "jr", "九州旅客鉄道": "jr",
    # 鉄→鐵、電鐵→電鉄などの旧字・表記揺れ
    "わたらせ渓谷鐵道": "わたらせ渓谷鉄道", "信楽高原鐵道": "信楽高原鉄道", "小湊鐵道": "小湊鉄道", "真岡鐵道": "真岡鉄道", "和歌山電鐵": "わかやま電鉄",
    "一畑電車": "一畑電気鉄道", "上毛電気鉄道": "上毛電鉄", "京福電気鉄道": "京福電鉄", "京阪電気鉄道": "京阪電鉄", "南海電気鉄道": "南海電鉄",
    "山陽電気鉄道": "山陽電鉄", "新京成電鉄": "新京成電鉄", "熊本電気鉄道": "熊本電鉄", "筑豊電気鉄道": "筑豊電鉄", "阪神電気鉄道": "阪神電鉄",
    "銚子電気鉄道": "銚子電鉄", "高松琴平電気鉄道": "高松琴平電鉄",
    # 略称・通称
    "首都圏新都市鉄道":"つくばエクスプレス", "上田電鉄":"上田交通", "東京地下鉄": "東京メトロ", "大阪市高速電気軌道": "osakametro",
    "アイジーアールいわて銀河鉄道": "igrいわて銀河鉄道", "willertrains": "京都丹後鉄道", "東海交通事業": "jr東海交通事業",
    "横浜シーサイドライン": "横浜新都市交通", "松本電鉄": "アルピコ交通",
    # 自治体運営
    "東京都": "都営地下鉄", "京都市": "京都市交通局", "仙台市": "仙台市営地下鉄", "名古屋市": "名古屋市営地下鉄", "札幌市": "札幌市営地下鉄",
    "函館市": "函館市電", "横浜市": "横浜市営地下鉄", "神戸市": "神戸市営地下鉄", "福岡市": "福岡市営地下鉄", "熊本市": "熊本市交通局", "鹿児島市": "鹿児島市交通局",
    # 法人格
    "一般社団法人札幌市交通事業振興公社": "札幌市交通事業振興公社", "一般社団法人神戸住環境整備公社": "神戸住環境整備公社", "一般財団法人青函トンネル記念館": "青函トンネル記念館",
}

LINE_MAPPING_TABLE = {
    "JR山手線": "山手線", "JR京浜東北線": "京浜東北線", "JR中央線快速": "中央線", "中央本線": "中央線", "丸ノ内線(方南町支線)": "丸ノ内線",
}

def normalize_string(text: str) -> str:
    if not isinstance(text, str): return ""
    text = mojimoji.zen_to_han(text, kana=False)
    text = text.lower()
    text = text.replace(' ', '').replace('　', '')
    return text

def apply_normalization_mapping(df: pd.DataFrame, company_map: dict = None, line_map: dict = None) -> pd.DataFrame:
    df_mapped = df.copy()
    if company_map and 'norm_company' in df_mapped.columns:
        df_mapped['norm_company'] = df_mapped['norm_company'].map(company_map).fillna(df_mapped['norm_company'])
    if line_map and 'norm_line' in df_mapped.columns:
        df_mapped['norm_line'] = df_mapped['norm_line'].map(line_map).fillna(df_mapped['norm_line'])
    return df_mapped

def preprocess_data(data_path: str, keys: list) -> pd.DataFrame:
    try:
        df_orig = pd.read_json(data_path)
        logger.info(f"【読込】 {data_path} -> {len(df_orig)}件")
    except Exception as e:
        logger.error(f"ファイルの読み込みに失敗しました: {data_path} - {e}")
        return pd.DataFrame()

    if not all(key in df_orig.columns for key in keys):
        logger.error(f"{data_path}に必要なキー {keys} が不足しています。")
        return pd.DataFrame()

    df_unique = df_orig.drop_duplicates(subset=keys, keep='first').copy()
    for key in keys:
        df_unique[f'norm_{key}'] = df_unique[key].apply(normalize_string)
    return df_unique

def _write_comparison_files(main_only: list, lookup_only: list, prefix: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    main_only_sorted = sorted([str(i) for i in main_only])
    lookup_only_sorted = sorted([str(i) for i in lookup_only])

    # .txtファイルの出力を削除

    df_comparison = pd.DataFrame({
        f'{prefix}_main_only': pd.Series(main_only_sorted),
        f'{prefix}_lookup_only': pd.Series(lookup_only_sorted)
    })
    df_comparison.to_csv(os.path.join(output_dir, f'{prefix}_comparison.csv'), index=False, encoding='utf-8-sig')
    logger.info(f"「{prefix}」の比較CSVファイルを '{output_dir}' に保存しました。")

def generate_company_comparison_files(main_data_path: str, lookup_data_path: str, output_dir: str):
    logger.info("会社名の比較ファイル生成を開始します。")
    common_keys = ['company', 'line', 'station']
    df_main = preprocess_data(main_data_path, common_keys)
    df_lookup = preprocess_data(lookup_data_path, common_keys)
    if df_main.empty or df_lookup.empty: return

    df_main_norm = apply_normalization_mapping(df_main, company_map=COMPANY_MAPPING_TABLE)
    df_lookup_norm = apply_normalization_mapping(df_lookup, company_map=COMPANY_MAPPING_TABLE)

    main_set = set(df_main_norm['norm_company'].dropna().unique())
    lookup_set = set(df_lookup_norm['norm_company'].dropna().unique())
    _write_comparison_files(list(main_set - lookup_set), list(lookup_set - main_set), 'company_normalized', output_dir)
    logger.info(f"会社名の比較ファイルが '{output_dir}' に正常に生成されました。")

def generate_line_comparison_files(main_data_path: str, lookup_data_path: str, output_dir: str):
    logger.info("路線名の比較ファイル生成を開始します。")
    common_keys = ['company', 'line', 'station']
    df_main = preprocess_data(main_data_path, common_keys)
    df_lookup = preprocess_data(lookup_data_path, common_keys)
    if df_main.empty or df_lookup.empty: return

    df_main_norm = apply_normalization_mapping(df_main, company_map=COMPANY_MAPPING_TABLE)
    df_lookup_norm = apply_normalization_mapping(df_lookup, company_map=COMPANY_MAPPING_TABLE)

    common_companies = set(df_main_norm['norm_company'].dropna().unique()).intersection(set(df_lookup_norm['norm_company'].dropna().unique()))
    
    main_tuples = set(map(tuple, df_main_norm[df_main_norm['norm_company'].isin(common_companies)][['norm_company', 'norm_line']].dropna().drop_duplicates().values))
    lookup_tuples = set(map(tuple, df_lookup_norm[df_lookup_norm['norm_company'].isin(common_companies)][['norm_company', 'norm_line']].dropna().drop_duplicates().values))
    
    _write_comparison_files(list(main_tuples - lookup_tuples), list(lookup_tuples - main_tuples), 'line_in_common_company', output_dir)
    logger.info(f"路線名の比較ファイルが '{output_dir}' に正常に生成されました。")

def generate_station_comparison_files(main_data_path: str, lookup_data_path: str, output_dir: str):
    logger.info("駅名の比較ファイル生成を開始します。")
    common_keys = ['company', 'line', 'station']
    df_main = preprocess_data(main_data_path, common_keys)
    df_lookup = preprocess_data(lookup_data_path, common_keys)
    if df_main.empty or df_lookup.empty: return

    df_main_norm = apply_normalization_mapping(df_main, company_map=COMPANY_MAPPING_TABLE, line_map=LINE_MAPPING_TABLE)
    df_lookup_norm = apply_normalization_mapping(df_lookup, company_map=COMPANY_MAPPING_TABLE, line_map=LINE_MAPPING_TABLE)

    merge_keys = ['norm_company', 'norm_line']
    merged = pd.merge(df_main_norm[merge_keys].drop_duplicates(), df_lookup_norm[merge_keys].drop_duplicates(), on=merge_keys, how='inner')
    
    main_tuples = set(map(tuple, pd.merge(merged, df_main_norm, on=merge_keys, how='inner')[['norm_company', 'norm_line', 'norm_station']].dropna().drop_duplicates().values))
    lookup_tuples = set(map(tuple, pd.merge(merged, df_lookup_norm, on=merge_keys, how='inner')[['norm_company', 'norm_line', 'norm_station']].dropna().drop_duplicates().values))
    
    _write_comparison_files(list(main_tuples - lookup_tuples), list(lookup_tuples - main_tuples), 'station_in_common_line', output_dir)
    logger.info(f"駅名の比較ファイルが '{output_dir}' に正常に生成されました。")

def generate_all_comparison_files(main_data_path: str, lookup_data_path: str, output_dir: str):
    logger.info("全てのレベルの比較ファイル生成を開始します。")
    
    # 各レベルの比較関数を呼び出す (出力先は同じディレクトリ)
    generate_company_comparison_files(main_data_path, lookup_data_path, output_dir)
    generate_line_comparison_files(main_data_path, lookup_data_path, output_dir)
    generate_station_comparison_files(main_data_path, lookup_data_path, output_dir)
    
    logger.info(f"全ての比較ファイルが '{output_dir}' に正常に生成されました。")

if __name__ == '__main__':
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    MAIN_DATA_PATH = os.path.join(PROJECT_ROOT, 'data/processed/stationcode.json')
    LOOKUP_DATA_PATH = os.path.join(PROJECT_ROOT, 'data/processed/rent_marketprice.json')
    OUTPUT_DIR = os.path.join(PROJECT_ROOT, 'data/processed/normalization_comparison')
    
    logger.info(f"入力ファイル: {MAIN_DATA_PATH}, {LOOKUP_DATA_PATH}")
    logger.info(f"出力ディレクトリ: {OUTPUT_DIR}")

    generate_all_comparison_files(
        main_data_path=MAIN_DATA_PATH,
        lookup_data_path=LOOKUP_DATA_PATH,
        output_dir=OUTPUT_DIR
    ) 