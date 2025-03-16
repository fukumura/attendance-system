# DoS保護の実装ドキュメント

このドキュメントでは、勤怠管理システムに実装されたDoS（Denial of Service）保護対策について説明します。

## 実装概要

勤怠管理システムのバックエンドには、以下のDoS保護対策が実装されています：

1. **レート制限（Rate Limiting）**
2. **セキュリティヘッダー設定**
3. **ペイロードサイズ制限**

これらの対策により、システムはDoS攻撃に対する基本的な耐性を持ち、サービスの可用性と安定性が向上します。

## 使用パッケージ

DoS保護の実装には、以下のnpmパッケージを使用しています：

- **express-rate-limit**: リクエスト数の制限
- **helmet**: セキュリティ関連のHTTPヘッダー設定

## 実装詳細

### 1. レート制限（Rate Limiting）

レート制限は、特定の時間枠内でのリクエスト数を制限する機能です。IPアドレスごとにリクエスト数をカウントし、制限を超えた場合は429（Too Many Requests）エラーを返します。

#### 全体的なレート制限

すべてのAPIエンドポイントに対して、以下のレート制限が適用されています：

```typescript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分間
  max: 100, // IPアドレスごとに100リクエストまで
  standardHeaders: true, // 'RateLimit-*' ヘッダーを含める
  legacyHeaders: false, // 'X-RateLimit-*' ヘッダーを無効化
  message: { error: 'リクエスト数が多すぎます。しばらく経ってから再試行してください。' }
});

app.use(generalLimiter);
```

#### 認証エンドポイント用の厳格なレート制限

認証関連のエンドポイント（ログイン、登録）には、より厳格なレート制限が適用されています：

```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分間
  max: 10, // IPアドレスごとに10リクエストまで
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '認証リクエスト数が多すぎます。しばらく経ってから再試行してください。' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### 2. セキュリティヘッダー設定（Helmet.js）

Helmet.jsを使用して、セキュリティ関連のHTTPヘッダーを設定しています：

```typescript
app.use(helmet());
```

これにより、以下のようなセキュリティヘッダーが設定されます：

- **Content-Security-Policy**: XSSなどの攻撃を防止
- **X-XSS-Protection**: ブラウザのXSS対策を有効化
- **X-Frame-Options**: クリックジャッキング対策
- **X-Content-Type-Options**: MIMEタイプスニッフィング対策
- その他多数のセキュリティヘッダー

### 3. ペイロードサイズ制限

大きなペイロードによるDoS攻撃を防ぐため、リクエストボディのサイズを制限しています：

```typescript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

これにより、1MBを超えるJSONデータやフォームデータのリクエストは拒否されます。

## 設定のカスタマイズ

### レート制限の調整

実際の使用パターンに基づいて、レート制限の値を調整することができます：

```typescript
// 全体的なレート制限の調整例
const generalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間に変更
  max: 200, // 上限を200に増加
  // その他の設定
});

// 認証エンドポイント用のレート制限の調整例
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間に変更
  max: 20, // 上限を20に増加
  // その他の設定
});
```

### Helmet.jsの設定カスタマイズ

特定のセキュリティヘッダーをカスタマイズする場合は、以下のように設定できます：

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        // その他のディレクティブ
      },
    },
    // その他のオプション
  })
);
```

### ペイロードサイズの調整

必要に応じて、ペイロードサイズの制限を調整できます：

```typescript
app.use(express.json({ limit: '2mb' })); // 2MBに増加
app.use(express.urlencoded({ extended: true, limit: '2mb' })); // 2MBに増加
```

## 高度なDoS対策（将来の拡張）

より高度なDoS対策として、以下の実装を検討できます：

### 1. IPベースのブラックリスト

悪意のあるIPアドレスをブラックリストに登録し、リクエストをブロックする機能：

```typescript
// 例: express-ipfilter を使用
import { IpFilter } from 'express-ipfilter';

const blacklist = ['123.456.78.9', '987.654.32.1'];
app.use(IpFilter(blacklist, { mode: 'deny' }));
```

### 2. 分散レート制限

複数のサーバーインスタンスがある場合、Redis/Memcachedを使用した分散レート制限：

```typescript
// 例: rate-limit-redis を使用
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis({ host: 'redis-server', port: 6379 });

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  // その他の設定
});
```

### 3. クラウドサービスのDoS対策

より高度なDDoS対策として、以下のクラウドサービスの利用も検討できます：

- **Cloudflare**: DDoS保護、WAF、キャッシュ機能
- **AWS Shield**: AWSリソースのDDoS保護
- **Google Cloud Armor**: GCPリソースのDDoS保護

## モニタリングと改善

DoS対策の効果を監視し、継続的に改善するために以下を実施することをお勧めします：

1. **ログ分析**: レート制限の発動頻度や拒否されたリクエストのパターンを分析
2. **アラート設定**: 異常なトラフィックパターンを検出した場合のアラート
3. **定期的なレビュー**: 設定値の妥当性を定期的にレビュー
4. **セキュリティ監査**: 外部のセキュリティ専門家によるレビュー

## 注意事項

1. **正規ユーザーへの影響**: レート制限が厳しすぎると正規ユーザーの使用に影響する可能性があります。実際の使用パターンに基づいて調整してください。

2. **マルチテナント環境での考慮**: 企業IDごとのレート制限も検討し、特定の企業が他の企業のリソースに影響を与えないようにすることも重要です。

3. **スケーラビリティ**: システムが成長するにつれて、より高度なDoS対策の実装を検討してください。

## 参考リソース

- [express-rate-limit ドキュメント](https://github.com/express-rate-limit/express-rate-limit)
- [Helmet.js ドキュメント](https://helmetjs.github.io/)
- [OWASP DoS対策ガイド](https://owasp.org/www-community/attacks/Denial_of_Service)
