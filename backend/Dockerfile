FROM --platform=linux/arm64 node:20-alpine

WORKDIR /app

# 必要なパッケージをインストール（OpenSSLを含む）
RUN apk add --no-cache \
    openssl \
    libssl3 \
    libcrypto3 \
    libc6-compat

# パッケージ管理ファイルをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# ソースコードのコピー
COPY . .

# Prisma Clientの生成
RUN npx prisma generate

# TypeScriptのビルド
RUN npm run build

# CORS関連の環境変数を設定
ENV CORS_ORIGIN="*"
ENV CORS_METHODS="GET,POST,PUT,DELETE,OPTIONS,PATCH"
ENV CORS_ALLOWED_HEADERS="Content-Type,Authorization,X-Company-ID,X-Requested-With,Origin,Accept,Access-Control-Allow-Headers"
ENV CORS_CREDENTIALS="true"
ENV CORS_MAX_AGE="86400"
ENV CORS_PREFLIGHT_CONTINUE="false"
ENV CORS_OPTIONS_SUCCESS_STATUS="204"

# セキュリティ設定の環境変数
ENV HELMET_CROSS_ORIGIN_POLICY="cross-origin"
ENV DISABLE_CONTENT_SECURITY_POLICY="true"

# アプリケーション起動時にマイグレーションを実行してからサーバー起動
CMD npx prisma migrate deploy && npm start
