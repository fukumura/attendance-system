# Docker Compose による勤怠管理システムのセットアップ手順

このドキュメントでは、Docker Compose を使用して勤怠管理システムをローカル環境で実行する手順を説明します。

## 前提条件

以下のソフトウェアがインストールされていることを確認してください：

- Docker
- Docker Compose

また、以下の点も確認してください：

- Docker デーモンが起動していること（Docker Desktop アプリケーションが実行中であること）
- 十分なディスク容量があること（少なくとも 2GB の空き容量を推奨）

## セットアップ手順

### 1. リポジトリのクローン

まず、リポジトリをクローンします（既にクローン済みの場合はスキップしてください）：

```bash
git clone <リポジトリURL>
cd attendance-system
```

### 2. 環境変数の設定

必要な環境変数ファイルは既に作成されていますが、必要に応じてカスタマイズできます：

- `backend/.env` - バックエンドの環境変数
- `frontend/.env` - フロントエンドの環境変数

### 3. Docker Compose でアプリケーションを起動

まず、Docker デーモンが実行中であることを確認してください。Docker Desktop アプリケーションが起動していない場合は、起動してください。

次に、以下のコマンドを実行して、アプリケーションを起動します：

```bash
docker-compose up -d
```

初回実行時は、イメージのビルドに時間がかかる場合があります。

このコマンドは以下のサービスを起動します：

- **postgres**: PostgreSQL データベース（ポート 5432）
- **backend**: バックエンド API サーバー（ポート 5000）
- **frontend**: フロントエンド Web アプリケーション（ポート 3000）
- **pgadmin**: PostgreSQL 管理ツール（ポート 5050）

### 4. データベースのマイグレーションと初期データの投入

バックエンドコンテナに接続して、データベースのマイグレーションと初期データの投入を行います：

```bash
# バックエンドコンテナに接続
docker-compose exec backend sh

# コンテナ内で以下のコマンドを実行
npx prisma migrate dev
npx prisma db seed
```

### 5. アプリケーションへのアクセス

セットアップが完了したら、以下の URL でアプリケーションにアクセスできます：

- **フロントエンド**: http://localhost:3000
- **バックエンド API**: http://localhost:5000
- **PGAdmin（データベース管理）**: http://localhost:5050
  - Email: admin@example.com
  - Password: admin

### 6. テスト用アカウント

以下のテスト用アカウントでログインできます：

- **管理者**:
  - Email: admin@example.com
  - Password: admin123

- **従業員**:
  - Email: user@example.com
  - Password: user123

## トラブルシューティング

### 一般的な問題

#### Docker デーモンが実行されていない

エラーメッセージ: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`

解決策:
1. Docker Desktop アプリケーションが起動していることを確認してください
   - macOS: メニューバーのDockerアイコンを確認
   - Windows: タスクトレイのDockerアイコンを確認
2. Docker Desktop が起動していない場合は、アプリケーションを起動してください
   - macOS: Spotlight検索で「Docker」と入力して起動
   - Windows: スタートメニューから「Docker Desktop」を起動
3. Docker Desktop が起動しても問題が解決しない場合:
   - Docker Desktop を再起動してみてください
   - ターミナルで `docker info` コマンドを実行して、Docker デーモンのステータスを確認
4. それでも問題が解決しない場合:
   - システムを再起動してみてください
   - Docker Desktop の設定を確認し、必要に応じてリセットしてください

#### Docker Desktop のインストールが必要

Docker コマンドが見つからない場合:

1. Docker Desktop をインストールしてください:
   - macOS: https://docs.docker.com/desktop/install/mac-install/
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/
2. インストール後、Docker Desktop を起動してください
3. 初回起動時には、利用規約への同意やその他の設定が必要な場合があります

#### ポートが既に使用されている

エラーメッセージ: `Bind for 0.0.0.0:5000 failed: port is already allocated`

解決策:
- 競合しているアプリケーションを終了する
- docker-compose.yml ファイルでポート番号を変更する（例: "5001:5000"）

#### イメージのビルドに失敗する

解決策:
- Dockerfile に問題がないか確認する
- インターネット接続を確認する
- Docker のキャッシュをクリアする: `docker builder prune -a`

#### コンテナが起動しない、またはすぐに終了する

解決策:
- コンテナのログを確認する: `docker-compose logs <サービス名>`
- 環境変数が正しく設定されているか確認する
- コンテナを再構築する: `docker-compose up -d --build`

#### bcrypt ライブラリの互換性問題

エラーメッセージ: `Error loading shared library /app/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: Exec format error`

解決策:
1. bcrypt の代わりに bcryptjs を使用する:
   - package.json ファイルを編集して bcrypt を bcryptjs に置き換える
   - @types/bcrypt を @types/bcryptjs に置き換える
   - ソースコードの import 文を `import bcrypt from 'bcrypt'` から `import bcrypt from 'bcryptjs'` に変更する
2. コンテナを再構築する:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

この問題は、bcrypt ライブラリがネイティブコードを使用しており、コンテナのアーキテクチャ（例: ARM64）とホストマシンのアーキテクチャが異なる場合に発生します。bcryptjs は純粋な JavaScript で実装されているため、アーキテクチャの違いに影響されません。

### コンテナのログを確認

問題が発生した場合は、コンテナのログを確認してください：

```bash
# すべてのコンテナのログを表示
docker-compose logs

# 特定のサービスのログを表示（例：backend）
docker-compose logs backend

# リアルタイムでログを表示
docker-compose logs -f
```

### コンテナの再起動

特定のサービスに問題がある場合は、そのサービスを再起動してみてください：

```bash
docker-compose restart backend
```

### コンテナの再構築

コードや Dockerfile を変更した場合は、イメージを再構築する必要があります：

```bash
docker-compose up -d --build
```

### データベースのリセット

データベースをリセットする必要がある場合：

```bash
# コンテナとボリュームを停止・削除
docker-compose down -v

# 再度起動
docker-compose up -d

# マイグレーションと初期データの投入を再実行
docker-compose exec backend sh -c "npx prisma migrate dev && npx prisma db seed"
```

### Docker リソースのクリーンアップ

Docker リソースが多くなりすぎた場合は、以下のコマンドでクリーンアップできます：

```bash
# 未使用のコンテナ、ネットワーク、イメージ、ボリュームを削除
docker system prune -a --volumes
```

注意: このコマンドは、停止中のコンテナ、未使用のネットワーク、ダングリングイメージ、未使用のボリュームをすべて削除します。

## アプリケーションの停止

アプリケーションを停止するには：

```bash
# コンテナを停止（データは保持）
docker-compose stop

# または、コンテナを停止・削除（データは保持）
docker-compose down

# コンテナとボリュームを停止・削除（データは削除）
docker-compose down -v
```

## 開発ワークフロー

### コードの変更

- フロントエンドとバックエンドのコードはホストマシンとコンテナ間でボリュームマウントされているため、ホストマシン上でコードを変更すると、変更が自動的にコンテナに反映されます。
- ほとんどの変更は自動的に反映されますが、依存関係を変更した場合などは、コンテナを再構築する必要があります。

### 依存関係の追加

新しいパッケージを追加する場合：

```bash
# バックエンドに依存関係を追加
docker-compose exec backend npm install <パッケージ名>

# フロントエンドに依存関係を追加
docker-compose exec frontend npm install <パッケージ名>
```

または、ホストマシン上で依存関係を追加した後、コンテナを再構築します：

```bash
docker-compose up -d --build
```
