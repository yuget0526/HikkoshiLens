# プロジェクトの起動方法

このプロジェクトは Docker Compose を使用して起動できます。以下の手順に従ってください。

## 開発モードでの起動

開発モードでは、`frontend-dev` サービスが起動します。以下のコマンドを実行してください。

```bash
docker compose down  # 既存のコンテナを停止
# 開発モードで起動
docker compose --profile dev up --build
```

起動後、以下の URL にアクセスしてください:

- フロントエンド: [http://localhost:3000](http://localhost:3000)
- バックエンド: [http://localhost:8000](http://localhost:8000)

## 本番モードでの起動

本番モードでは、`frontend` サービスが起動します。以下のコマンドを実行してください。

```bash
docker compose down  # 既存のコンテナを停止
# 本番モードで起動
docker compose up --build
```

起動後、以下の URL にアクセスしてください:

- フロントエンド: [http://localhost:3000](http://localhost:3000)
- バックエンド: [http://localhost:8000](http://localhost:8000)

## トラブルシューティング

問題が発生した場合、以下のコマンドで状態を確認してください:

```bash
docker compose ps
docker ps -a --filter name=hikkoshilens
docker network ls
docker network inspect $(docker network ls --filter name=hikkoshilens_default -q) || true
```

エラー内容を確認し、必要に応じてサポートを受けてください。
