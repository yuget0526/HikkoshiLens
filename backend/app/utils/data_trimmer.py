import csv
import json
import os

# Configuration classes and functions moved from config.py
class AreaCodeConfig:
    """areacodeのデータ処理設定"""
    name = "areacode"
    input_file_path = "data/raw/csv/FEA_hyoujun-20250605175358.csv"
    output_file_path = "data/processed/areacode.json"
    processor_specific_config = {
        "columns_to_extract": [
            {"index": 0, "json_key": "code"},
            {"index": 1, "json_key": "prefecture"},
            {"index": 2, "json_key": "government_ordinance_city_county_etc"},
            {"index": 4, "json_key": "city_town_village"}
        ]
    }

class StationCodeConfig:
    """stationcodeのデータ処理設定"""
    name = "stationcode"
    input_file_path = "data/raw/geojson/N02-22_Station.geojson"
    output_file_path = "data/processed/stationcode.json"
    processor_specific_config = {
        "properties_to_extract": [
            {"geojson_key": "N02_004", "json_key": "company"},
            {"geojson_key": "N02_003", "json_key": "line"},
            {"geojson_key": "N02_005", "json_key": "station"},
            {"geojson_key": "N02_005c", "json_key": "stationcode"},
        ],
        "geometry_config": {
            "filter_by_type": "LineString",
            "output_key": "coordinates"
        }
    }

ALL_CONFIGS = [AreaCodeConfig, StationCodeConfig]

# 設定名をキーとする辞書を事前に作成
_CONFIGS_BY_NAME = {config.name: config for config in ALL_CONFIGS}

def get_config_by_name(name: str):
    """指定された名前に一致する設定クラスを返します。"""
    return _CONFIGS_BY_NAME.get(name)

def check_config_exists(config_name: str):
    """
    指定された設定名が存在するかどうかをチェックし、
    存在しない場合はValueErrorを発生させます。
    """
    if not get_config_by_name(config_name):
        available_configs = [cfg.name for cfg in ALL_CONFIGS]
        error_detail = f"Configuration '{config_name}' not found. " \
                        f"Available configurations: {available_configs}"
        raise ValueError(error_detail)

def process_areacode_data(config) -> list:
    """areacode設定に基づいてCSVファイルからデータを抽出します。"""
    csv_file_path = config.input_file_path
    processor_config = config.processor_specific_config
    columns_to_extract = processor_config["columns_to_extract"]

    data = []
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # ヘッダー行は処理対象外なのでスキップ
        for row in reader:
            extracted_row = {}
            for col_setting in columns_to_extract:
                col_index = col_setting["index"]
                json_key = col_setting["json_key"]
                # CSVの行に十分な列数が存在するかチェック
                if col_index < len(row):
                    extracted_row[json_key] = row[col_index]
                else:
                    # 列が足りない場合は警告を出力してスキップ
                    print(f"Warning: Row in {csv_file_path} has fewer than {col_index + 1} columns. Skipping column '{json_key}' for this row: {row}")
            if extracted_row:
                data.append(extracted_row)
    return data

def _calculate_average_coordinates(coordinates: list, feature_id_val: str, geometry_type: str) -> list | None:
    """
    GeoJSONの座標リストから平均座標（中心点）を計算します。
    MultiLineStringやPolygonのようなネストされた座標構造にも対応します。
    """
    if not coordinates or not isinstance(coordinates, list):
        print(f"Warning: Invalid or empty coordinates for {geometry_type} feature '{feature_id_val}'. Skipping.")
        return None

    flat_points = []
    # 再帰関数でネストされた座標リストをフラットな[経度, 緯度]のリストに変換
    def flatten(coords):
        # 最初の要素が数値であれば、それは[経度, 緯度]のペアと判断
        if isinstance(coords, list) and len(coords) > 0 and isinstance(coords[0], (int, float)):
            flat_points.append(coords)
        # そうでなければ、リストの各要素に対して再帰的にflattenを呼び出す
        elif isinstance(coords, list):
            for item in coords:
                flatten(item)
    
    flatten(coordinates)

    if not flat_points:
        print(f"Warning: No valid points found in coordinates for feature '{feature_id_val}'.")
        return None

    sum_lon, sum_lat = 0.0, 0.0
    num_points = 0
    
    # 全ての座標点の合計を計算
    for point_pair in flat_points:
        try:
            if isinstance(point_pair, list) and len(point_pair) >= 2:
                lon = float(point_pair[0])
                lat = float(point_pair[1])
                sum_lon += lon
                sum_lat += lat
                num_points += 1
            else:
                raise TypeError("Point is not a list of two numbers")
        except (ValueError, TypeError, IndexError) as e:
            # 不正な形式の座標はスキップ
            print(f"Warning: Skipping invalid coordinate point {point_pair} for feature '{str(feature_id_val)}' due to {e}")
    
    # 有効な座標点が一つでもあれば平均を計算して返す
    if num_points > 0:
        return [sum_lon / num_points, sum_lat / num_points]
    else:
        print(f"Warning: No valid coordinate points found to average for feature '{str(feature_id_val)}'. Skipping.")
        return None

def process_stationcode_data(config) -> list:
    """stationcode設定に基づいてGeoJSONファイルからデータを抽出します。"""
    input_file_path = config.input_file_path
    processor_config = config.processor_specific_config
    properties_to_extract = processor_config.get("properties_to_extract", [])
    geometry_config = processor_config.get("geometry_config", {})
    filter_geom_type = geometry_config.get("filter_by_type")
    geom_proc_output_key = geometry_config.get("output_key")

    with open(input_file_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    features = geojson_data.get("features", [])
    if not isinstance(features, list):
        raise ValueError(f"'features' in {input_file_path} is not a list.")

    results = []
    # GeoJSONの各フィーチャー（地物）をループ処理
    for feature in features:
        if not isinstance(feature, dict):
            print(f"Warning: Skipping non-dictionary item in features list: {feature}")
            continue

        props = feature.get("properties", {})
        geom = feature.get("geometry", {})
        if not (isinstance(props, dict) and isinstance(geom, dict)):
            print(f"Warning: Skipping feature with non-dictionary properties or geometry: {feature.get('id', 'Unknown feature')}")
            continue

        # ログ出力用に、フィーチャーを識別するためのIDを取得
        feature_id_for_logs = "Unknown feature"
        if properties_to_extract:
            log_id_key = properties_to_extract[0].get("geojson_key")
            if log_id_key and log_id_key in props:
                feature_id_for_logs = props[log_id_key]

        # 1. フィルタリング: 指定されたジオメトリタイプと一致しないフィーチャーは除外
        if filter_geom_type and geom.get("type") != filter_geom_type:
            continue

        # 2. プロパティの抽出: 設定に基づいて必要なプロパティを抽出
        result_item = {
            prop["json_key"]: props[prop["geojson_key"]]
            for prop in properties_to_extract if prop["geojson_key"] in props
        }

        # 3. ジオメトリの処理: 座標の平均値を計算
        if geom_proc_output_key:
            coordinates = geom.get("coordinates")
            geom_type = geom.get("type", "Unknown")
            # ヘルパー関数で平均座標を計算
            processed_geom = _calculate_average_coordinates(coordinates, str(feature_id_for_logs), geom_type)
            if processed_geom:
                result_item[geom_proc_output_key] = processed_geom
            else:
                # 座標の処理に失敗したフィーチャーは結果に含めない
                continue

        if result_item:
            results.append(result_item)
            
    return results

def _process_and_save(config):
    """
    単一の設定に基づいてデータ処理を実行し、結果をJSONファイルに保存します。
    """
    name = config.name
    print(f"--- Processing: {name} ---")
    input_path = config.input_file_path
    output_path = config.output_file_path

    try:
        data = None
        if name == "areacode":
            data = process_areacode_data(config)
        elif name == "stationcode":
            data = process_stationcode_data(config)
        else:
            print(f"Warning: No processor found for '{name}'. Skipping.")
            return

        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"Created directory: {output_dir}")

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        print(f"Successfully converted {input_path} to {output_path}")

    except FileNotFoundError:
        print(f"Error: File not found at {input_path}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error processing file {input_path}: {e}")
    except Exception as e:
        print(f"An unexpected error occurred processing '{name}': {e}")
    finally:
        print(f"--- Finished: {name} ---\n")

def main(config_name: str = None):
    """
    データ処理のエントリーポイント。
    引数で設定名が指定された場合はその設定のみを、指定されない場合は全ての設定を処理します。
    """
    configs_to_run = []
    if config_name:
        config_to_run = get_config_by_name(config_name)
        if config_to_run:
            configs_to_run.append(config_to_run)
        else:
            print(f"Error: Config '{config_name}' not found.")
            return
    else:
        configs_to_run = ALL_CONFIGS

    if not configs_to_run:
        print("No configurations to process.")
        return
        
    title = f"'{config_name}'" if config_name else 'all configs'
    print(f"--- Starting data processing for: {title} ---")
    
    for config in configs_to_run:
        if config:
            _process_and_save(config)
            
    print("--- All processing finished ---")


if __name__ == '__main__':
    main() 