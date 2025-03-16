# メール送信機能の実装

## 概要

勤怠管理システムにメール送信機能を実装しました。この機能は主にユーザー登録時のメール認証に使用されます。開発環境では[Ethereal Email](https://ethereal.email/)を使用してメールをテストし、本番環境ではAmazon SESを使用します。

## 実装内容

### 1. データモデルの拡張

ユーザーモデルに以下のフィールドを追加しました：

```prisma
model User {
  // 既存フィールド...
  isEmailVerified        Boolean           @default(false)
  verificationToken      String?
  verificationTokenExpiry DateTime?
  // 既存フィールド...
}
```

### 2. メール送信サービス

`emailService.ts` を作成し、以下の機能を実装しました：

- 環境に応じたメール送信方法の切り替え（開発: Ethereal Email、本番: Amazon SES）
- HTML形式のメールテンプレート処理
- メール認証用のメール送信機能

### 3. 認証フローの更新

認証フローを以下のように更新しました：

1. ユーザー登録時に認証トークンを生成し、メールで送信
2. ユーザーがメール内のリンクをクリックして認証
3. 認証が完了するまでログインを制限

### 4. 新しいAPIエンドポイント

以下の新しいAPIエンドポイントを追加しました：

- `POST /api/auth/verify-email`: メールアドレス認証
- `POST /api/auth/resend-verification`: 認証メールの再送信

## 設定方法

### 開発環境

`.env` ファイルに以下の環境変数を追加してください：

```
# Email settings
EMAIL_FROM="noreply@example.com"
EMAIL_FROM_NAME="勤怠管理システム"
FRONTEND_URL="http://localhost:3000"
COMPANY_NAME="勤怠管理システム"
COMPANY_LOGO=""
```

### 本番環境（Railway）

Railway上で以下の環境変数を設定してください：

```
# Email settings
EMAIL_FROM="noreply@your-domain.com"
EMAIL_FROM_NAME="勤怠管理システム"
FRONTEND_URL="https://your-frontend-url.com"
COMPANY_NAME="勤怠管理システム"
COMPANY_LOGO="https://your-logo-url.com/logo.png"

# Amazon SES settings
AWS_REGION="ap-northeast-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

## テスト方法

メール送信機能をテストするには、以下のコマンドを実行してください：

```bash
npm run test:email
```

開発環境では、Ethereal Emailのテストアカウントが自動的に作成され、コンソールに以下の情報が表示されます：

- ユーザー名
- パスワード
- メールプレビューURL

これらの情報を使用して、[Ethereal Email](https://ethereal.email/login)にログインし、送信されたメールを確認できます。

## 注意事項

- 開発環境では実際にメールは送信されず、Ethereal Emailでプレビューのみ可能です
- 本番環境ではAmazon SESの設定が必要です
- メール認証トークンの有効期限は24時間です
