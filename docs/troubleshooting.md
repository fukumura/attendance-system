# トラブルシューティングガイド | Troubleshooting Guide

このドキュメントでは、勤怠管理システムを使用する際に発生する可能性のある一般的な問題と、その解決方法について説明します。

*This document describes common issues that may occur when using the Attendance Management System and how to resolve them.*

## 目次 | Table of Contents

- [開発環境の問題 | Development Environment Issues](#開発環境の問題--development-environment-issues)
- [バックエンドの問題 | Backend Issues](#バックエンドの問題--backend-issues)
- [フロントエンドの問題 | Frontend Issues](#フロントエンドの問題--frontend-issues)
- [認証の問題 | Authentication Issues](#認証の問題--authentication-issues)
- [データベースの問題 | Database Issues](#データベースの問題--database-issues)
- [Docker関連の問題 | Docker-related Issues](#docker関連の問題--docker-related-issues)
- [よくある質問 | Frequently Asked Questions](#よくある質問--frequently-asked-questions)

## 開発環境の問題 | Development Environment Issues

### Node.jsバージョンの互換性 | Node.js Version Compatibility

**問題 | Issue**: パッケージのインストールや実行時にエラーが発生する。

**解決策 | Solution**: 
- Node.js v18.x以上を使用していることを確認してください。
- `nvm`を使用している場合は、`nvm use 18`を実行してください。

```bash
# Node.jsバージョンの確認 | Check Node.js version
node -v

# npmバージョンの確認 | Check npm version
npm -v
```

### 依存関係の問題 | Dependency Issues

**問題 | Issue**: `npm install`実行時に依存関係のエラーが発生する。

**解決策 | Solution**:
- package-lock.jsonを削除して再インストールを試みる。
- npmキャッシュをクリアする。

```bash
# package-lock.jsonの削除 | Remove package-lock.json
rm package-lock.json

# npmキャッシュのクリア | Clear npm cache
npm cache clean --force

# 再インストール | Reinstall
npm install
```

## バックエンドの問題 | Backend Issues

### サーバー起動エラー | Server Startup Errors

**問題 | Issue**: バックエンドサーバーが起動しない。

**解決策 | Solution**:
- ポートが既に使用されていないか確認する。
- 環境変数が正しく設定されているか確認する。
- ログを確認して具体的なエラーを特定する。

```bash
# 使用中のポートを確認 | Check ports in use
lsof -i :5000

# 環境変数の確認 | Check environment variables
cat backend/.env

# 詳細なログでサーバーを起動 | Start server with detailed logs
cd backend
DEBUG=express:* npm run dev
```

### データベース接続エラー | Database Connection Errors

**問題 | Issue**: データベースに接続できない。

**解決策 | Solution**:
- `.env`ファイルのデータベース接続文字列を確認する。
- PostgreSQLサービスが実行中であることを確認する。
- データベースユーザーに適切な権限があることを確認する。

```bash
# PostgreSQLサービスのステータスを確認 | Check PostgreSQL service status
sudo service postgresql status  # Linux
brew services list              # macOS

# データベースへの接続テスト | Test database connection
psql -U your_username -d your_database
```

## フロントエンドの問題 | Frontend Issues

### ビルドエラー | Build Errors

**問題 | Issue**: フロントエンドのビルドに失敗する。

**解決策 | Solution**:
- 依存関係が最新であることを確認する。
- node_modulesを削除して再インストールする。
- TypeScriptエラーを修正する。

```bash
# node_modulesの削除と再インストール | Remove and reinstall node_modules
cd frontend
rm -rf node_modules
npm install

# TypeScriptの型チェック | TypeScript type checking
npm run tsc
```

### API接続エラー | API Connection Errors

**問題 | Issue**: フロントエンドがバックエンドAPIに接続できない。

**解決策 | Solution**:
- バックエンドサーバーが実行中であることを確認する。
- CORSの設定が正しいことを確認する。
- APIのベースURLが正しく設定されていることを確認する。

```bash
# バックエンドサーバーのステータスを確認 | Check backend server status
curl http://localhost:5000/api/health

# フロントエンドの環境変数を確認 | Check frontend environment variables
cat frontend/.env
```

## 認証の問題 | Authentication Issues

### ログインエラー | Login Errors

**問題 | Issue**: ユーザーがログインできない。

**解決策 | Solution**:
- 認証情報が正しいことを確認する。
- JWTシークレットが正しく設定されていることを確認する。
- ブラウザのローカルストレージをクリアしてみる。

```bash
# JWTシークレットの確認 | Check JWT secret
grep JWT_SECRET backend/.env

# デフォルト管理者アカウントでのログイン | Login with default admin account
# Email: admin@example.com
# Password: password
```

### トークン期限切れ | Token Expiration

**問題 | Issue**: 短時間でセッションが切れる。

**解決策 | Solution**:
- JWTトークンの有効期限設定を確認する。
- リフレッシュトークンのメカニズムが正しく機能しているか確認する。

```bash
# トークン有効期限の設定を確認 | Check token expiration settings
grep TOKEN_EXPIRY backend/src/config/auth.ts
```

## データベースの問題 | Database Issues

### マイグレーションエラー | Migration Errors

**問題 | Issue**: Prismaマイグレーションが失敗する。

**解決策 | Solution**:
- マイグレーションファイルに矛盾がないか確認する。
- データベースをリセットして再試行する。
- Prismaクライアントを再生成する。

```bash
# Prismaクライアントの再生成 | Regenerate Prisma client
cd backend
npx prisma generate

# マイグレーションのリセット | Reset migrations
npx prisma migrate reset

# 新しいマイグレーションの作成 | Create a new migration
npx prisma migrate dev --name init
```

### データ整合性の問題 | Data Integrity Issues

**問題 | Issue**: データベース内のデータに不整合がある。

**解決策 | Solution**:
- Prismaスキーマの制約を確認する。
- データベースのシードスクリプトを実行して初期データをリセットする。

```bash
# データベースのシード実行 | Run database seed
cd backend
npx prisma db seed
```

## Docker関連の問題 | Docker-related Issues

### コンテナ起動エラー | Container Startup Errors

**問題 | Issue**: Dockerコンテナが起動しない。

**解決策 | Solution**:
- Dockerログを確認する。
- docker-compose.ymlファイルの設定を確認する。
- Dockerイメージを再ビルドする。

```bash
# Dockerログの確認 | Check Docker logs
docker-compose logs

# コンテナの状態確認 | Check container status
docker-compose ps

# イメージの再ビルド | Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

### ボリュームマウントの問題 | Volume Mount Issues

**問題 | Issue**: コンテナ内でファイルの変更が反映されない。

**解決策 | Solution**:
- ボリュームマウントの設定を確認する。
- Dockerボリュームをクリーンアップする。

```bash
# Dockerボリュームの一覧表示 | List Docker volumes
docker volume ls

# 未使用のボリュームを削除 | Remove unused volumes
docker volume prune
```

## よくある質問 | Frequently Asked Questions

### Q: 開発環境と本番環境の違いは何ですか？
**A**: 開発環境では、ホットリロードやデバッグツールが有効になっており、本番環境では最適化されたビルドが使用されます。環境変数の設定も異なります。

### Q: テストデータはどのように生成できますか？
**A**: バックエンドディレクトリで`npx prisma db seed`コマンドを実行すると、`prisma/seed.ts`に定義されたテストデータが生成されます。

### Q: パスワードをリセットする方法は？
**A**: 現在、管理者ユーザーがユーザー管理画面からパスワードをリセットできます。セルフサービスのパスワードリセット機能は開発中です。

### Q: システムのバックアップ方法は？
**A**: PostgreSQLのバックアップコマンド`pg_dump`を使用するか、Docker環境の場合はボリュームのバックアップを作成します。

```bash
# PostgreSQLデータベースのバックアップ | Backup PostgreSQL database
pg_dump -U username -d database_name > backup.sql
```

---

問題が解決しない場合は、GitHubのIssueを作成するか、開発チームにお問い合わせください。
*If your problem is not resolved, please create an issue on GitHub or contact the development team.*
