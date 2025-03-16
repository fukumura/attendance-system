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
RUN npx tsc --skipLibCheck

# マイグレーションを実行してからサーバー起動（配列形式で正確に指定）
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push --accept-data-loss && node dist/server.js"]
