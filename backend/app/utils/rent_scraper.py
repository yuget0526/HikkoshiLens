import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from datetime import datetime
import os
import time
import random
import logging
from dataclasses import dataclass, asdict

# Configuration classes moved from config.py
class PathConfig:
    """ファイルパス関連の設定"""
    # スクレイピングした家賃データを保存するJSONファイルのパス
    OUTPUT_FILE = 'data/processed/rent_marketprice.json'
    # 都道府県コードのマッピングファイルのパス
    PREFECTURE_CODE_MAP_FILE = 'backend/app/const/prefecture_codes.json'

class ScrapingConfig:
    """スクレイピン対象サイトやヘッダーに関する設定"""
    BASE_URL = "https://suumo.jp/chintai/soba/"
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0'
    ]
    HEADERS = {
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }

class RequestConfig:
    """リクエストのタイミングやリトライに関する設定"""
    MAX_RETRIES = 3                 # 最大リトライ回数
    RETRY_DELAY_SECONDS = 5         # リトライ時の待機時間（秒）
    REQUEST_MIN_DELAY = 1.0         # 各リクエスト前の最小待機時間（秒）
    REQUEST_MAX_DELAY = 3.0         # 各リクエスト前の最大待機時間（秒）
    REQUEST_TIMEOUT_SECONDS = 15    # リクエストのタイムアウト時間（秒）

class ParallelConfig:
    """並列処理に関する設定"""
    MAX_WORKERS = 10                # 並列処理のワーカースレッド数 

# logging の基本設定
# INFOレベル以上のログを出力し、タイムスタンプ、ログレベル、メッセージの形式で表示
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- データモデル定義 ---
@dataclass(frozen=True)
class Prefecture:
    """都道府県情報を保持するデータクラス"""
    name: str
    url: str

@dataclass(frozen=True)
class Line:
    """路線情報を保持するデータクラス"""
    name: str
    url: str

@dataclass(frozen=True)
class StationRentInfo:
    """収集した生の駅家賃情報を保持するデータクラス"""
    station: str
    rent: str

@dataclass
class StationData:
    """処理済みの駅家賃データを保持するデータクラス"""
    prefecture: str
    railway_company: str
    line_name: str
    station_name: str
    rent: float
    lastupdate: str | None = None


class SuumoScraper:
    """SUUMOのウェブサイトから家賃相場データを取得するためのスクレイパークラス"""
    def __init__(self, headers: dict):
        self.headers = headers

    def make_request_with_retry(self, url: str, error_context: str) -> requests.Response | None:
        """指定されたURLに対してリトライ付きのGETリクエストを送信する"""
        for attempt in range(RequestConfig.MAX_RETRIES):
            time.sleep(random.uniform(RequestConfig.REQUEST_MIN_DELAY, RequestConfig.REQUEST_MAX_DELAY))
            request_specific_headers = self.headers.copy()
            if ScrapingConfig.USER_AGENTS:
                request_specific_headers["User-Agent"] = random.choice(ScrapingConfig.USER_AGENTS)
            
            try:
                response = requests.get(url, headers=request_specific_headers, timeout=RequestConfig.REQUEST_TIMEOUT_SECONDS)
                response.raise_for_status()
                response.encoding = response.apparent_encoding
                return response
            except requests.RequestException as e:
                logger.warning(f"❌ リクエストエラー ({error_context}, 試行 {attempt + 1}/{RequestConfig.MAX_RETRIES}): {e} ({url})")
                if attempt + 1 == RequestConfig.MAX_RETRIES:
                    logger.error(f"🚨 最大リトライ回数に達しました。{error_context} の取得に失敗しました: {url}")
                    return None
                time.sleep(RequestConfig.RETRY_DELAY_SECONDS)
        return None

    def get_prefecture_info_list(self, base_url: str) -> list[Prefecture]:
        """都道府県名と路線一覧ページURLのリストを取得する"""
        response = self.make_request_with_retry(base_url, "都道府県リスト取得")
        if not response:
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        prefecture_links = soup.find_all("a", class_="areamenu_detail-btn")

        prefecture_info_list = []
        for tag in prefecture_links:
            href = tag.get("href")
            name = tag.text.strip()
            if href:
                full_url = urljoin(base_url, href)
                full_url = f"{full_url}ensen/" 
                prefecture_info_list.append(Prefecture(name=name, url=full_url))
                
        return prefecture_info_list

    def get_line_info_list(self, base_url: str) -> dict[str, list[Line]]:
        """指定された都道府県の路線情報を取得する"""
        response = self.make_request_with_retry(base_url, "路線リスト取得")
        if not response:
            return {}

        soup = BeautifulSoup(response.text, "html.parser")
        search_table = soup.find("table", class_="searchtable")
        if not search_table:
            logger.info(f"💡 注意: 路線情報テーブル (searchtable) が見つかりませんでした ({base_url})")
            return {} 

        search_table_list = search_table.find_all("tr")
        company_to_lines_map = {}

        for railway_company_row in search_table_list:
            railway_company_th = railway_company_row.find("th" , class_="searchtable-title")
            if not railway_company_th:
                continue
            railway_company_name = railway_company_th.text.strip()
            company_to_lines_map[railway_company_name] = []

            for searchitem_td in railway_company_th.find_next_siblings("td"):
                line_links = searchitem_td.find_all("a")
                for link in line_links:
                    href = link.get("href")
                    line_name = link.text.strip()
                    if href:
                        full_url = urljoin(base_url, href)
                        company_to_lines_map[railway_company_name].append(Line(name=line_name, url=full_url))
                    else:
                        logger.info(f"💡 注意: 路線リンクの href が見つかりませんでした: {line_name} ({base_url})")
        
        return company_to_lines_map
    
    def get_station_rent_list(self, line_url: str) -> list[StationRentInfo]:
        """指定された路線の駅ごとの家賃データを取得する"""
        response = self.make_request_with_retry(line_url, "駅家賃データ取得")
        if not response:
            return []

        soup = BeautifulSoup(response.text, "html.parser")
        station_rows = soup.find_all("tr", class_="js-graph-data")
        results = []

        if not station_rows:
            logger.info(f"💡 注意: 駅データ行 (js-graph-data) が見つかりませんでした ({line_url})")
            return []

        for row in station_rows:
            first_td_tag = row.find("td")
            station_name = first_td_tag.text.strip() if first_td_tag else "不明"
            
            price_tag_element = row.find("span", class_="graphpanel_matrix-td_graphinfo-strong")
            price_text = price_tag_element.text.strip() if price_tag_element else "不明"
            
            results.append(StationRentInfo(station=station_name, rent=price_text))
        
        return results

class ScrapingOrchestrator:
    """スクレイピング処理全体を管理し、並列実行を制御するクラス"""
    def __init__(self, scraper: SuumoScraper, max_workers: int):
        self.scraper = scraper
        self.max_workers = max_workers

    def execute(self, base_url: str) -> tuple[list[StationData], dict]:
        """スクレイピング処理を実行し、収集したデータと統計情報を返す"""
        prefectures = self.scraper.get_prefecture_info_list(base_url)
        prefecture_total_count = len(prefectures)

        if not prefectures:
            logger.error("都道府県リストが取得できませんでした。処理を終了します。")
            stats = {"prefecture_total": 0, "processed_prefectures_with_lines": 0, "station_data_count": 0}
            return [], stats

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_station_data_result, processed_prefectures_with_lines = self._submit_line_tasks(executor, prefectures)
            all_station_data = self._collect_station_data(future_to_station_data_result)
        
        stats = {
            "prefecture_total": prefecture_total_count,
            "processed_prefectures_with_lines": processed_prefectures_with_lines,
            "station_data_count": len(all_station_data)
        }
        return all_station_data, stats

    def _submit_line_tasks(self, executor: ThreadPoolExecutor, prefectures: list[Prefecture]) -> tuple[dict, int]:
        future_to_lines_result = {
            executor.submit(self.scraper.get_line_info_list, pref.url): pref
            for pref in prefectures
        }

        future_to_station_data_result = {}
        processed_prefectures_count = 0

        for future in as_completed(future_to_lines_result):
            prefecture = future_to_lines_result[future]
            try:
                company_to_lines_map_result = future.result()
                if company_to_lines_map_result:
                    processed_prefectures_count += 1
                    for railway_company, lines in company_to_lines_map_result.items():
                        for line in lines:
                            future_to_station_data_result[executor.submit(self.scraper.get_station_rent_list, line.url)] = \
                                (prefecture.name, railway_company, line.name, line.url)
                else:
                    logger.info(f"💡 注意: {prefecture.name} ({prefecture.url}) の路線一覧が空でした（データなしとして処理）。")
            except Exception as exc:
                logger.error(f'{prefecture.name} ({prefecture.url}) の路線一覧取得中にエラーが発生しました: {exc}')
        return future_to_station_data_result, processed_prefectures_count

    def _collect_station_data(self, future_to_station_data_result: dict) -> list[StationData]:
        all_station_data = []
        for future in as_completed(future_to_station_data_result):
            pref_name, railway_company, line_name, line_url = future_to_station_data_result[future]
            try:
                station_data_list = future.result()
                if station_data_list:
                    for station_info in station_data_list:
                        station_name = station_info.station
                        rent_str = station_info.rent
                        
                        if station_name and rent_str and rent_str not in ["不明", "---"]: 
                            try:
                                rent_float = float(rent_str)
                                all_station_data.append(StationData(
                                    prefecture=pref_name,
                                    railway_company=railway_company,
                                    line_name=line_name,
                                    station_name=station_name,
                                    rent=rent_float
                                ))
                            except (ValueError, TypeError):
                                logger.warning(f"⚠️ 家賃データ '{rent_str}' を数値に変換できませんでした。スキップします。({pref_name}, {line_name}, {station_name})")
                else:
                    logger.info(f"💡 {pref_name} の {line_name} ({line_url}) の駅データは空でした。")
            except Exception as exc:
                logger.error(f'駅家賃データ処理中にエラーが発生しました ({pref_name}, {line_name}): {exc}', exc_info=True)
                
        return all_station_data

def load_prefecture_code_map(file_path: str) -> dict:
    """都道府県コードマップファイルを読み込む"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"エラー: 都道府県コードファイルが見つかりません: {file_path}")
        return {}
    except json.JSONDecodeError:
        logger.error(f"エラー: 都道府県コードファイルのJSON形式が正しくありません: {file_path}")
        return {}


def sort_data_by_prefecture_code(station_data_list: list[StationData], prefecture_codes_map: dict) -> list[StationData]:
    """都道府県コードに基づいて駅データをソートする"""
    if not prefecture_codes_map:
        logger.warning("都道府県コードマップが空のため、ソート処理をスキップします。")
        return station_data_list

    def get_sort_key(item: StationData) -> int | float:
        """ソート用のキーを返す（都道府県コード、見つからなければ無限大）"""
        # マップから都道府県コードを取得（文字列）。見つからなければNone
        code_str = prefecture_codes_map.get(item.prefecture)
        # コードを整数に変換しようと試みる。変換できない、またはNoneの場合はfloat('inf')を返す
        try:
            return int(code_str) if code_str is not None else float('inf')
        except (ValueError, TypeError):
            return float('inf')

    # ソートキー関数を使ってリストをソート
    sorted_list = sorted(station_data_list, key=get_sort_key)
    
    # ソートできなかった項目（コード不明）があればログで通知
    not_sorted_items = [item.prefecture for item in sorted_list if get_sort_key(item) == float('inf')]
    if not_sorted_items:
        logger.info(f"💡 注意: 次の都道府県はコードが不明なため、ソート順が保証されません: {list(set(not_sorted_items))}")
        
    return sorted_list


def save_data_to_json(station_data_list: list[StationData], filename: str):
    """収集・処理した駅データをJSONファイルに保存する"""
    output_dir = os.path.dirname(filename)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
        logger.info(f"📁 出力ディレクトリを作成しました: {output_dir}")

    # StationDataオブジェクトを辞書のリストに変換
    data_to_save = [asdict(data) for data in station_data_list]

    # 現在時刻を'lastupdate'キーとして各辞書に追加
    current_time_iso = datetime.now().isoformat()
    for item in data_to_save:
        item['lastupdate'] = current_time_iso
    
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=4)
        logger.info(f"✅ データをJSONファイルに保存しました: {filename} ({len(data_to_save)}件)")
    except IOError as e:
        logger.error(f"🚨 ファイルの書き込み中にエラーが発生しました: {e}")

def main():
    """スクレイピング処理のメイン関数"""
    logger.info("🚀 スクレイピング処理を開始します...")
    start_time = time.time()
    
    scraper = SuumoScraper(headers=ScrapingConfig.HEADERS)
    orchestrator = ScrapingOrchestrator(scraper=scraper, max_workers=ParallelConfig.MAX_WORKERS)
    
    all_station_data, stats = orchestrator.execute(base_url=ScrapingConfig.BASE_URL)
    
    prefecture_code_map = load_prefecture_code_map(PathConfig.PREFECTURE_CODE_MAP_FILE)
    sorted_station_data = sort_data_by_prefecture_code(all_station_data, prefecture_code_map)
    
    save_data_to_json(sorted_station_data, PathConfig.OUTPUT_FILE)
    
    end_time = time.time()
    logger.info(f"🎉 スクレイピング処理が完了しました。")
    logger.info(f"📊 --- 統計情報 ---")
    logger.info(f"   - 全都道府県数: {stats['prefecture_total']}")
    logger.info(f"   - データ取得対象の都道府県数: {stats['processed_prefectures_with_lines']}")
    logger.info(f"   - 収集した駅データ総数: {stats['station_data_count']}")
    logger.info(f"   - 処理時間: {end_time - start_time:.2f}秒")

if __name__ == '__main__':
    main() 