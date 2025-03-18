# テスト実行方法

このプロジェクトでは、以下の方法でテストを実行できます。

## シンプルテスト

シンプルテストは、Jest を使わずに Node.js で直接実行できるテストです。各コントローラーの基本的な機能をテストします。

```bash
# すべてのシンプルテストを実行
npm run test:all

# 特定のシンプルテストを実行
node tests/simple-test.js
node tests/controllers/authController.simple.test.js
```

## Jest テスト

Jest を使ったテストは、現在開発中です。将来的には以下のコマンドで実行できるようになります。

```bash
# すべてのテストを実行
npm test

# 特定のテストファイルを実行
npx jest tests/controllers/authController.test.ts
```

## テストファイルの構成

- `tests/simple-test.js` - 基本的なテスト
- `tests/controllers/*.simple.test.js` - 各コントローラーのシンプルテスト
- `tests/controllers/*.test.ts` - 各コントローラーの Jest テスト（開発中）

## テスト開発ガイドライン

新しいテストを追加する場合は、以下のガイドラインに従ってください。

1. シンプルテストは `.simple.test.js` という拡張子を使用
2. Jest テストは `.test.ts` という拡張子を使用
3. テストファイルは対応するコントローラーと同じ名前を使用
4. テスト関数は明確な名前を使用（例: `testAuthController`）
