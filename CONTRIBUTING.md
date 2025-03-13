# 貢献ガイドライン | Contributing Guidelines

勤怠管理システムプロジェクトへの貢献に興味をお持ちいただき、ありがとうございます。このドキュメントでは、プロジェクトへの貢献方法について説明します。

*Thank you for your interest in contributing to the Attendance Management System project. This document describes how to contribute to the project.*

## 目次 | Table of Contents

- [行動規範 | Code of Conduct](#行動規範--code-of-conduct)
- [はじめに | Getting Started](#はじめに--getting-started)
- [開発ワークフロー | Development Workflow](#開発ワークフロー--development-workflow)
- [プルリクエスト | Pull Requests](#プルリクエスト--pull-requests)
- [コーディング規約 | Coding Standards](#コーディング規約--coding-standards)
- [コミットメッセージ | Commit Messages](#コミットメッセージ--commit-messages)
- [テスト | Testing](#テスト--testing)
- [ドキュメント | Documentation](#ドキュメント--documentation)
- [バグ報告 | Bug Reports](#バグ報告--bug-reports)
- [機能リクエスト | Feature Requests](#機能リクエスト--feature-requests)

## 行動規範 | Code of Conduct

このプロジェクトでは、オープンで歓迎的な環境を維持するために、貢献者に対して敬意と礼儀を持って行動することを期待しています。

*In this project, we expect contributors to act with respect and courtesy to maintain an open and welcoming environment.*

## はじめに | Getting Started

1. リポジトリをフォークする | Fork the repository
2. リポジトリをクローンする | Clone your fork
   ```bash
   git clone https://github.com/your-username/attendance-system.git
   cd attendance-system
   ```
3. アップストリームリモートを追加する | Add the upstream remote
   ```bash
   git remote add upstream https://github.com/original-owner/attendance-system.git
   ```
4. 開発環境をセットアップする | Set up your development environment
   ```bash
   # バックエンドのセットアップ | Backend setup
   cd backend
   npm install
   cp .env.example .env  # 環境変数を設定 | Configure environment variables
   
   # フロントエンドのセットアップ | Frontend setup
   cd ../frontend
   npm install
   cp .env.example .env  # 環境変数を設定 | Configure environment variables
   ```

## 開発ワークフロー | Development Workflow

1. 最新の変更を取得する | Get the latest changes
   ```bash
   git checkout main
   git pull upstream main
   ```

2. 新しいブランチを作成する | Create a new branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. 変更を加える | Make your changes
   - コードを変更する | Change code
   - テストを追加/更新する | Add/update tests
   - ドキュメントを更新する | Update documentation

4. 変更をコミットする | Commit your changes
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. 変更をプッシュする | Push your changes
   ```bash
   git push origin feature/your-feature-name
   ```

6. プルリクエストを作成する | Create a pull request

## プルリクエスト | Pull Requests

プルリクエストを作成する際は、以下のガイドラインに従ってください：

*When creating a pull request, please follow these guidelines:*

- プルリクエストのタイトルと説明は明確にする | Make the title and description clear
- 関連するIssueがある場合は、プルリクエストの説明で言及する | Mention related issues in the description
- 変更内容を説明する | Explain what changes you've made
- スクリーンショットやGIFがあれば追加する | Add screenshots or GIFs if applicable
- すべてのテストが通過することを確認する | Ensure all tests pass
- コードレビューのフィードバックに対応する | Address code review feedback

## コーディング規約 | Coding Standards

このプロジェクトでは、一貫性のあるコードベースを維持するために、以下のコーディング規約に従ってください：

*In this project, please follow these coding standards to maintain a consistent codebase:*

- [コーディング規約の詳細](docs/coding-rules.md)を参照してください | Refer to [coding standards details](docs/coding-rules.md)
- ESLintとPrettierの設定に従う | Follow ESLint and Prettier configurations
- TypeScriptの型を適切に使用する | Use TypeScript types appropriately
- コメントは明確で簡潔にする | Keep comments clear and concise
- 関数とクラスには適切なJSDocコメントを追加する | Add appropriate JSDoc comments to functions and classes

## コミットメッセージ | Commit Messages

コミットメッセージは[Conventional Commits](https://www.conventionalcommits.org/)の形式に従ってください：

*Commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/) format:*

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**タイプ | Types**:
- `feat`: 新機能 | New feature
- `fix`: バグ修正 | Bug fix
- `docs`: ドキュメントのみの変更 | Documentation only changes
- `style`: コードの意味に影響しない変更（空白、フォーマット、セミコロンの欠落など） | Changes that do not affect the meaning of the code
- `refactor`: バグ修正でも機能追加でもないコード変更 | Code change that neither fixes a bug nor adds a feature
- `perf`: パフォーマンスを向上させる変更 | Change that improves performance
- `test`: 不足しているテストの追加または既存のテストの修正 | Adding missing tests or correcting existing tests
- `chore`: ビルドプロセスやツールの変更 | Changes to the build process or auxiliary tools

## テスト | Testing

新しい機能を追加する場合や既存の機能を変更する場合は、適切なテストを追加または更新してください：

*When adding new features or modifying existing ones, please add or update appropriate tests:*

- ユニットテスト | Unit tests
- 統合テスト | Integration tests
- E2Eテスト | E2E tests

```bash
# バックエンドテストの実行 | Run backend tests
cd backend
npm test

# フロントエンドテストの実行 | Run frontend tests
cd frontend
npm test

# E2Eテストの実行 | Run E2E tests
npm run test:e2e
```

## ドキュメント | Documentation

コードの変更に伴い、必要に応じてドキュメントを更新してください：

*Update documentation as needed with code changes:*

- READMEの更新 | Update README
- APIドキュメントの更新 | Update API documentation
- コメントの追加/更新 | Add/update comments
- 必要に応じて新しいドキュメントの作成 | Create new documentation as needed

## バグ報告 | Bug Reports

バグを報告する場合は、以下の情報を含めてください：

*When reporting a bug, please include the following information:*

- バグの簡潔な説明 | A concise description of the bug
- 再現手順 | Steps to reproduce
- 期待される動作 | Expected behavior
- 実際の動作 | Actual behavior
- スクリーンショットまたはGIF（可能な場合） | Screenshots or GIFs if possible
- 環境情報（ブラウザ、OS、アプリケーションバージョンなど） | Environment information (browser, OS, application version, etc.)

## 機能リクエスト | Feature Requests

新機能をリクエストする場合は、以下の情報を含めてください：

*When requesting a new feature, please include the following information:*

- 機能の簡潔な説明 | A concise description of the feature
- この機能がなぜ必要か | Why this feature is needed
- 考えられる実装方法（オプション） | Possible implementation approaches (optional)
- 関連する既存の機能やIssue | Related existing features or issues

---

ご質問やご不明な点がございましたら、お気軽にIssueを作成するか、プロジェクトメンテナーにお問い合わせください。

*If you have any questions or concerns, please feel free to create an issue or contact the project maintainers.*
