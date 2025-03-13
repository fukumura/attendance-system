# 勤怠管理システム (Attendance Management System)

勤怠管理システムは、従業員の出退勤記録、休暇申請、勤怠レポートを管理するためのウェブアプリケーションです。

## 機能

- **ユーザー認証**
  - サインアップ/ログイン
  - ロールベースのアクセス制御（一般従業員/管理者）

- **勤怠記録**
  - 出勤/退勤の打刻
  - 勤務時間の自動計算
  - 勤怠履歴の表示

- **休暇管理**
  - 休暇申請の作成
  - 休暇申請の承認/却下
  - 休暇履歴の表示

- **レポート**
  - 個人の勤怠レポート
  - 部門別の勤怠レポート
  - レポートのエクスポート

## 技術スタック

### フロントエンド
- React + TypeScript
- Zustand (状態管理)
- React Query (データフェッチ)
- shadcn/ui + Tailwind CSS (UI)
- Vite (ビルドツール)

### バックエンド
- Express.js + TypeScript
- PostgreSQL + Prisma ORM
- JWT認証
- Zod (バリデーション)

## 開発環境のセットアップ

### 前提条件
- Node.js (v18.x 以上)
- PostgreSQL (v14.x 以上)
- Docker (オプション)

### 手動セットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/username/attendance-system.git
cd attendance-system
```

2. バックエンドのセットアップ
```bash
cd backend
npm install
cp .env.example .env  # 環境変数を設定
npx prisma migrate dev
npm run dev
```

3. フロントエンドのセットアップ
```bash
cd frontend
npm install
cp .env.example .env  # 環境変数を設定
npm run dev
```

### Dockerを使用したセットアップ

```bash
docker-compose up -d
```

## 使用方法

1. ブラウザで以下のURLにアクセス:
   - フロントエンド: http://localhost:3000
   - バックエンドAPI: http://localhost:5000

2. デフォルトの管理者アカウントでログイン:
   - メール: admin@example.com
   - パスワード: password

## プロジェクト構造

```
attendance-system/
├── backend/                # バックエンドアプリケーション
│   ├── src/
│   │   ├── controllers/    # リクエストハンドラ
│   │   ├── middlewares/    # ミドルウェア
│   │   ├── routes/         # APIルート定義
│   │   ├── services/       # ビジネスロジック
│   │   ├── utils/          # ユーティリティ関数
│   │   ├── app.ts          # Express アプリケーション
│   │   └── server.ts       # サーバー起動ファイル
│   ├── prisma/             # Prisma スキーマと移行
│   └── tests/              # テストファイル
│
├── frontend/               # フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── pages/          # ページコンポーネント
│   │   ├── store/          # Zustand ストア
│   │   ├── services/       # API通信関連
│   │   └── types/          # TypeScript型定義
│   └── tests/              # テストファイル
│
├── docs/                   # ドキュメント
└── docker-compose.yml      # Docker Compose 設定
```

## ライセンス

MIT
