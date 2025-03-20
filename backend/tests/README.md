# テスト実行方法

このプロジェクトでは、Jest を使用してテストを実行します。

## テスト実行コマンド

```bash
# すべてのテストを実行
npm test

# ユニットテストのみ実行
npm run test:unit

# 統合テストのみ実行
npm run test:integration

# テストカバレッジレポートを生成
npm run test:coverage

# ウォッチモードでテストを実行（ファイル変更時に自動実行）
npm run test:watch

# 特定のテストファイルを実行（例：メールサービス）
npm run test:email
```

## テストディレクトリ構造

```
tests/
├── unit/                     # 単体テスト
│   ├── controllers/          # コントローラーのテスト
│   ├── services/             # サービスのテスト
│   ├── utils/                # ユーティリティのテスト
│   └── middlewares/          # ミドルウェアのテスト
├── integration/              # 統合テスト
│   ├── api/                  # APIエンドポイントのテスト
│   └── services/             # サービス統合テスト
├── e2e/                      # エンドツーエンドテスト（将来用）
├── examples/                 # サンプルテスト
│   ├── simple-test.js        # 基本的なテスト例
│   ├── simple.test.ts        # TypeScriptテスト例
│   └── *.simple.test.js      # シンプルなコントローラーテスト例
├── utils/                    # テスト用ユーティリティ
│   ├── testUtils.ts          # 共通テストユーティリティ
│   └── mocks.ts              # モックオブジェクト（将来用）
└── setup.ts                  # Jestセットアップファイル
```

## テスト開発ガイドライン

新しいテストを追加する場合は、以下のガイドラインに従ってください。

1. テストファイルは `.test.ts` という拡張子を使用
2. テストファイルは対応するソースファイルと同じ名前を使用（例：`authController.ts` → `authController.test.ts`）
3. テストは適切なディレクトリに配置（単体テストは `unit/` 内、統合テストは `integration/` 内）
4. テスト関数は明確な名前を使用（例：「should register a new user successfully」）
5. 各テストは独立して実行できるようにする（他のテストに依存しない）
6. モックやスタブを使用して外部依存関係を分離する
