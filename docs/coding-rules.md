# 勤怠管理システム コーディング規約

## 1. 全般
- **言語**: TypeScript（strictモードを使用）
- **フレームワーク**: Node.js (Express) + React
- **ファイル名**: キャメルケース（例外：コンポーネントはパスカルケース）
- **コードフォーマット**: ESLint + Prettier を使用
- **バージョン管理**: Git + GitHub

### コードフォーマット設定
- インデント: スペース2つ
- 行末セミコロン: 必須
- 単一引用符を使用
- 末尾カンマ: 複数行の場合は必須
- 行の最大長: 100文字

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 依存関係管理
- パッケージバージョン: マイナーバージョン更新は許容 (`^`)
- 依存関係の定期更新: 毎月第一月曜日
- `package-lock.json` または `yarn.lock` をコミットに含める

## 2. バックエンド
### アーキテクチャ
- レイヤードアーキテクチャ採用：
  - routes → controllers → services → data access
- 各レイヤーの責務を明確に分離
  - **routes**: ルーティング定義のみ
  - **controllers**: リクエスト/レスポンス処理
  - **services**: ビジネスロジック
  - **data access**: データ操作

### コーディング
- 非同期処理は `async/await` を使用
- Promise チェーンは避ける
- エラーハンドリングは try/catch で適切に実施
- 環境変数は環境ごとに`.env`で管理（本番環境は`.env.production`）
- ユーティリティ関数は`utils/`にまとめる

### エラーハンドリング
- カスタムエラークラスの作成：
```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```
- 集中型エラーハンドラミドルウェアを実装
- エラーログは構造化ロギングを使用

### 命名規則
| 種類 | 規則 | 例 |
|------|------|-----|
| ファイル名 | キャメルケース | userService.ts |
| クラス | パスカルケース | UserService |
| メソッド/関数 | キャメルケース | getUserById |
| 変数 | キャメルケース | userData |
| 定数 | 大文字スネークケース | MAX_USERS |
| インターフェース | I + パスカルケース | IUserData |
| 型 | パスカルケース | UserType |
| Enum | パスカルケース | UserRole |

## 3. フロントエンド
### フレームワーク
- React (関数コンポーネント)
- 状態管理: Zustand
- API管理: React Query
- スタイリング: Tailwind CSS
- フォーム: React Hook Form
- バリデーション: Zod

### ディレクトリ構造
```
src/
├── components/
│   ├── common/
│   ├── features/
│   └── layouts/
├── hooks/
├── pages/
├── services/
├── stores/
├── types/
├── utils/
├── App.tsx
└── main.tsx
```

### 命名規則
| 種類 | 規則 | 例 |
|------|------|-----|
| コンポーネント名 | パスカルケース | UserCard.tsx |
| フック | useプレフィックス + キャメルケース | useUserData.ts |
| ストア | キャメルケース + Store | userStore.ts |
| CSSファイル | コンポーネント名と一致 | UserCard.module.css |

### コンポーネント設計
- 小さく再利用可能なコンポーネントを作成
- Propsには型定義を必須
- デフォルト値を適切に設定
- 不要なレンダリングを避けるためmemoを適切に使用

```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  // コンポーネントの実装
};
```

## 4. コミットメッセージ規約
| 種類 | 説明 |
|------|-----|
| feat | 機能追加 |
| fix | バグ修正 |
| docs | ドキュメント変更 |
| style | フォーマット変更（機能に影響なし） |
| refactor | リファクタリング（機能追加・バグ修正なし） |
| perf | パフォーマンス改善 |
| test | テスト追加・修正 |
| chore | その他の変更（ビルド設定等） |

例:
```
feat: ユーザーログイン機能の追加
```

コミットメッセージの形式:
```
<種類>: <簡潔な説明>

<詳細な説明（オプション）>

<関連するIssue番号（オプション）>
```

## 5. ブランチ戦略とレビュープロセス
### ブランチ命名規則
- `feature/<機能名>`: 新機能追加
- `bugfix/<バグ名>`: バグ修正
- `hotfix/<緊急バグ名>`: 本番環境への緊急修正
- `release/<バージョン>`: リリース準備
- `chore/<タスク名>`: その他のタスク

### レビュープロセス
1. ブランチで開発
2. Pull Request作成
   - テンプレートに従って記入
   - セルフレビュー実施
3. CI/CDによる自動テスト実行
4. コードレビュー
   - 最低1名の承認が必要
   - コメントへの対応
5. レビュー後マージ
6. mainブランチへのマージ後、自動デプロイ

## 6. テスト
- Jest + React Testing Library を使用
- テストファイル名: `*.test.ts`, `*.test.tsx`
- カバレッジ目標: 80%以上
- テストの種類:
  - 単体テスト: 関数・コンポーネント単位
  - 統合テスト: API・フロー単位
  - E2Eテスト: Cypress使用

### テスト規約
- AAAパターン（Arrange-Act-Assert）に従う
- モックは必要最小限に
- スナップショットテストは慎重に使用

## 7. ドキュメント
- APIドキュメントはOpenAPI（Swagger）を利用
- コードコメントはJSDoc形式を推奨
- README.mdには最低限以下を含める:
  - プロジェクト概要
  - セットアップ手順
  - 開発フロー
  - 技術スタック

### JSDocの例
```typescript
/**
 * ユーザー情報を取得する
 * @param {string} userId - ユーザーID
 * @returns {Promise<User>} ユーザー情報
 * @throws {NotFoundError} ユーザーが存在しない場合
 */
async function getUser(userId: string): Promise<User> {
  // 実装
}
```

## 8. セキュリティ
- APIキー等は環境変数で管理
- 認証・認可は適切に設定
  - JWTを使用
  - RBAC（ロールベースアクセス制御）の実装
- SQLインジェクション対策（パラメータ化クエリ）
- XSS対策（エスケープ、CSP）
- CSRF対策（トークン検証）
- 定期的な脆弱性スキャンを実施
- セキュリティ更新プログラムの適用

## 9. パフォーマンス
- フロントエンド:
  - バンドルサイズ最適化（コード分割、ツリーシェイキング）
  - 遅延読み込み（React.lazy、Suspense）
  - メモ化（useMemo、useCallback）
  - 仮想リスト（react-window等）
- バックエンド:
  - キャッシュ戦略
  - データベースインデックス
  - N+1問題の回避
- 定期的にパフォーマンスチェックを行う
  - Lighthouse
  - WebPageTest

## 10. アクセシビリティ
- セマンティックHTMLを使用
- ARIAラベルを適切に設定
- キーボードナビゲーションをサポート
- 十分な色コントラスト（WCAG AA準拠）
- スクリーンリーダー対応
- アクセシビリティテスト（axe-core等）

## 11. 技術的負債の管理
### コードコメント規約
- `// TODO:` - 将来実装予定の機能
- `// FIXME:` - 既知の問題
- `// HACK:` - 一時的な回避策
- 全てのコードコメントには担当者と日付を記載
  ```typescript
  // TODO(username, 2023-05-01): キャッシュ機構を実装する
  ```

### リファクタリング基準
- 同じコードが3回以上登場する場合
- 関数が30行を超える場合
- ファイルが300行を超える場合
- サイクロマティック複雑度が10を超える場合
- テストのカバレッジが基準を下回る場合

## 12. CI/CD設定
- GitHub Actionsを使用
- ビルド・テスト・デプロイを自動化
- PR時に以下を自動実行:
  - リント
  - 型チェック
  - ユニットテスト
  - カバレッジレポート
- mainブランチマージ後:
  - ステージング環境へ自動デプロイ
  - E2Eテスト実行
  - 承認後、本番環境へデプロイ

### GitHub Actionsワークフロー例
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Type check
        run: npm run type-check
      - name: Test
        run: npm test
  # 以下デプロイ設定
```
