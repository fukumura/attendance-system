 勤怠管理システム | Attendance Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-green.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

勤怠管理システムは、従業員の出退勤記録、休暇申請、勤怠レポートを管理するためのウェブアプリケーションです。

*This is a web application for managing employee attendance records, leave requests, and attendance reports.*

## 📑 目次 | Table of Contents

- [機能 | Features](#機能--features)
- [技術スタック | Tech Stack](#技術スタック--tech-stack)
- [開発環境のセットアップ | Development Setup](#開発環境のセットアップ--development-setup)
- [使用方法 | Usage](#使用方法--usage)
- [プロジェクト構造 | Project Structure](#プロジェクト構造--project-structure)
- [テスト | Testing](#テスト--testing)
- [トラブルシューティング | Troubleshooting](#トラブルシューティング--troubleshooting)
- [貢献 | Contributing](#貢献--contributing)
- [ライセンス | License](#ライセンス--license)

## 機能 | Features

- **ユーザー認証 | User Authentication**
  - サインアップ/ログイン | Sign up/Login
  - ロールベースのアクセス制御（一般従業員/管理者） | Role-based access control (Employee/Admin)

- **勤怠記録 | Attendance Records**
  - 出勤/退勤の打刻 | Clock in/out
  - 勤務時間の自動計算 | Automatic working hours calculation
  - 勤怠履歴の表示 | View attendance history

- **休暇管理 | Leave Management**
  - 休暇申請の作成 | Create leave requests
  - 休暇申請の承認/却下 | Approve/reject leave requests
  - 休暇履歴の表示 | View leave history

- **レポート | Reports**
  - 個人の勤怠レポート | Individual attendance reports
  - 部門別の勤怠レポート | Department-wise attendance reports
  - レポートのエクスポート | Export reports

## 技術スタック | Tech Stack

### フロントエンド | Frontend
- [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://github.com/pmndrs/zustand) (状態管理 | State management)
- [React Query](https://tanstack.com/query/latest) (データフェッチ | Data fetching)
- [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) (UI)
- [Vite](https://vitejs.dev/) (ビルドツール | Build tool)

### バックエンド | Backend
- [Express.js](https://expressjs.com/) + [TypeScript](https://www.typescriptlang.org/)
- [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- [JWT](https://jwt.io/) 認証 | Authentication
- [Zod](https://zod.dev/) (バリデーション | Validation)

## 開発環境のセットアップ | Development Setup

### 前提条件 | Prerequisites
- Node.js (v18.x 以上 | or higher)
- PostgreSQL (v14.x 以上 | or higher)
- Docker (オプション | optional)

### 手動セットアップ | Manual Setup

1. リポジトリのクローン | Clone the repository
```bash
git clone https://github.com/username/attendance-system.git
cd attendance-system
```

2. バックエンドのセットアップ | Backend setup
```bash
cd backend
npm install
cp .env.example .env  # 環境変数を設定 | Configure environment variables
npx prisma migrate dev
npm run dev
```

3. フロントエンドのセットアップ | Frontend setup
```bash
cd frontend
npm install
cp .env.example .env  # 環境変数を設定 | Configure environment variables
npm run dev
```

### Dockerを使用したセットアップ | Docker Setup

Docker Composeを使用して簡単にアプリケーションを起動できます：

```bash
docker-compose up -d
```

詳細なDockerセットアップ手順は [docs/docker-setup.md](docs/docker-setup.md) を参照してください。

*For detailed Docker setup instructions, refer to [docs/docker-setup.md](docs/docker-setup.md).*

## 使用方法 | Usage

1. ブラウザで以下のURLにアクセス | Access the following URLs in your browser:
   - フロントエンド | Frontend: http://localhost:3000
   - バックエンドAPI | Backend API: http://localhost:5000

2. デフォルトの管理者アカウントでログイン | Login with default admin account:
   - メール | Email: admin@example.com
   - パスワード | Password: password

### API ドキュメント | API Documentation

API の詳細なドキュメントは以下で確認できます | Detailed API documentation can be found at:
- 開発環境 | Development: http://localhost:5000/api-docs
- 本番環境 | Production: https://api.attendance-system.example.com/api-docs

## プロジェクト構造 | Project Structure

```
attendance-system/
├── backend/                # バックエンドアプリケーション | Backend application
│   ├── src/
│   │   ├── controllers/    # リクエストハンドラ | Request handlers
│   │   ├── middlewares/    # ミドルウェア | Middlewares
│   │   ├── routes/         # APIルート定義 | API route definitions
│   │   ├── services/       # ビジネスロジック | Business logic
│   │   ├── utils/          # ユーティリティ関数 | Utility functions
│   │   ├── app.ts          # Express アプリケーション | Express application
│   │   └── server.ts       # サーバー起動ファイル | Server startup file
│   ├── prisma/             # Prisma スキーマと移行 | Prisma schema and migrations
│   └── tests/              # テストファイル | Test files
│
├── frontend/               # フロントエンドアプリケーション | Frontend application
│   ├── src/
│   │   ├── components/     # Reactコンポーネント | React components
│   │   ├── hooks/          # カスタムフック | Custom hooks
│   │   ├── pages/          # ページコンポーネント | Page components
│   │   ├── store/          # Zustand ストア | Zustand stores
│   │   ├── services/       # API通信関連 | API communication
│   │   └── types/          # TypeScript型定義 | TypeScript type definitions
│   └── tests/              # テストファイル | Test files
│
├── docs/                   # ドキュメント | Documentation
└── docker-compose.yml      # Docker Compose 設定 | Docker Compose configuration
```

## テスト | Testing

### バックエンドテスト | Backend Tests

```bash
cd backend
npm test
```

### フロントエンドテスト | Frontend Tests

```bash
cd frontend
npm test
```

### E2Eテスト | E2E Tests

```bash
npm run test:e2e
```

## トラブルシューティング | Troubleshooting

### 一般的な問題 | Common Issues

1. **データベース接続エラー | Database Connection Errors**
   - `.env` ファイルのデータベース接続文字列を確認してください
   - Check the database connection string in your `.env` file

2. **ポートの競合 | Port Conflicts**
   - 他のアプリケーションが同じポートを使用していないか確認してください
   - Ensure no other applications are using the same ports

3. **Prismaエラー | Prisma Errors**
   - スキーマの変更後は `npx prisma generate` を実行してください
   - Run `npx prisma generate` after schema changes

詳細なトラブルシューティングガイドは [docs/troubleshooting.md](docs/troubleshooting.md) を参照してください。
*For a more detailed troubleshooting guide, refer to [docs/troubleshooting.md](docs/troubleshooting.md).*

## 貢献 | Contributing

プロジェクトへの貢献に興味がある場合は、以下の手順に従ってください：
*If you're interested in contributing to the project, please follow these steps:*

1. リポジトリをフォークする | Fork the repository
2. 機能ブランチを作成する (`git checkout -b feature/amazing-feature`)
3. 変更をコミットする (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュする (`git push origin feature/amazing-feature`)
5. プルリクエストを開く | Open a Pull Request

詳細なガイドラインは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。
*For more detailed guidelines, refer to [CONTRIBUTING.md](CONTRIBUTING.md).*

## ライセンス | License

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。
*This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.*
