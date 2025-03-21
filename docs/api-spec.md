# ポケット勤怠 API仕様書

## 基本情報

- **ベースURL**: `https://api.attendance-system.com/v1`
- **APIバージョン**: v1
- **データフォーマット**: JSON
- **文字コード**: UTF-8

## 認証

- JWT（JSON Web Token）ベースの認証
- 認証ヘッダー形式: `Authorization: Bearer {token}`
- トークン有効期限: 24時間
- リフレッシュトークン有効期限: 7日間

## 共通レスポンス形式

### 成功時レスポンス
```json
{
  "status": "success",
  "data": {
    // レスポンスデータ
  },
  "meta": {
    // ページネーション情報など
    "total": 100,
    "page": 1,
    "per_page": 10
  }
}
```

### エラー時レスポンス
```json
{
  "status": "error",
  "message": "エラーの詳細メッセージ",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "メールアドレスの形式が正しくありません"
    }
  ]
}
```

### ステータスコード
- 200: リクエスト成功
- 201: リソース作成成功
- 400: 不正なリクエスト
- 401: 認証エラー
- 403: 権限エラー
- 404: リソースが見つからない
- 422: バリデーションエラー
- 500: サーバーエラー

## APIエンドポイント詳細

### 企業管理API

#### 企業一覧取得
- **エンドポイント**: `GET /companies`
- **説明**: 企業一覧を取得（スーパー管理者のみ）
- **認証**: 必須（スーパー管理者権限）
- **クエリパラメータ**:
  - `page`: ページ番号（デフォルト: 1）
  - `limit`: 1ページあたりの件数（デフォルト: 10、最大: 100）
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "publicId": "COMP123456",
        "name": "株式会社サンプル",
        "logoUrl": "https://example.com/logo.png",
        "createdAt": "2025-03-15T10:52:00Z",
        "updatedAt": "2025-03-15T10:52:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "publicId": "COMP789012",
        "name": "テスト株式会社",
        "logoUrl": null,
        "createdAt": "2025-03-15T11:30:00Z",
        "updatedAt": "2025-03-15T11:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1
    }
  }
  ```

#### 企業詳細取得
- **エンドポイント**: `GET /companies/:id`
- **説明**: 指定したIDの企業情報を取得
- **認証**: 必須（スーパー管理者または該当企業の管理者）
- **パスパラメータ**:
  - `id`: 企業ID（UUID）または公開ID
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "publicId": "COMP123456",
      "name": "株式会社サンプル",
      "logoUrl": "https://example.com/logo.png",
      "settings": {
        "workHours": {
          "startTime": "09:00",
          "endTime": "18:00",
          "breakTime": 60
        },
        "holidays": ["Saturday", "Sunday"]
      },
      "createdAt": "2025-03-15T10:52:00Z",
      "updatedAt": "2025-03-15T10:52:00Z"
    }
  }
  ```

#### 企業作成
- **エンドポイント**: `POST /companies`
- **説明**: 新しい企業を作成（スーパー管理者のみ）
- **認証**: 必須（スーパー管理者権限）
- **リクエスト**:
  ```json
  {
    "name": "新規企業株式会社",
    "logoUrl": "https://example.com/newlogo.png",
    "settings": {
      "workHours": {
        "startTime": "10:00",
        "endTime": "19:00",
        "breakTime": 60
      }
    }
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "publicId": "COMP345678",
      "name": "新規企業株式会社",
      "logoUrl": "https://example.com/newlogo.png",
      "settings": {
        "workHours": {
          "startTime": "10:00",
          "endTime": "19:00",
          "breakTime": 60
        }
      },
      "createdAt": "2025-03-16T00:30:00Z",
      "updatedAt": "2025-03-16T00:30:00Z"
    }
  }
  ```

#### 企業更新
- **エンドポイント**: `PUT /companies/:id`
- **説明**: 指定したIDの企業情報を更新（スーパー管理者のみ）
- **認証**: 必須（スーパー管理者権限）
- **パスパラメータ**:
  - `id`: 企業ID（UUID）または公開ID
- **リクエスト**:
  ```json
  {
    "name": "更新企業株式会社",
    "logoUrl": "https://example.com/updatedlogo.png"
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "publicId": "COMP123456",
      "name": "更新企業株式会社",
      "logoUrl": "https://example.com/updatedlogo.png",
      "settings": {
        "workHours": {
          "startTime": "09:00",
          "endTime": "18:00",
          "breakTime": 60
        },
        "holidays": ["Saturday", "Sunday"]
      },
      "createdAt": "2025-03-15T10:52:00Z",
      "updatedAt": "2025-03-16T00:45:00Z"
    }
  }
  ```

#### 企業削除
- **エンドポイント**: `DELETE /companies/:id`
- **説明**: 指定したIDの企業を削除（スーパー管理者のみ）
- **認証**: 必須（スーパー管理者権限）
- **パスパラメータ**:
  - `id`: 企業ID（UUID）または公開ID
- **レスポンス**:
  ```json
  {
    "status": "success",
    "message": "企業を削除しました"
  }
  ```

#### 企業設定取得
- **エンドポイント**: `GET /companies/:id/settings`
- **説明**: 指定した企業の設定を取得
- **認証**: 必須（スーパー管理者または該当企業の管理者）
- **パスパラメータ**:
  - `id`: 企業ID（UUID）または公開ID
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "workHours": {
        "startTime": "09:00",
        "endTime": "18:00",
        "breakTime": 60
      },
      "holidays": ["Saturday", "Sunday"],
      "leavePolicy": {
        "paidLeavePerYear": 20,
        "sickLeavePerYear": 5
      }
    }
  }
  ```

#### 企業設定更新
- **エンドポイント**: `PUT /companies/:id/settings`
- **説明**: 指定した企業の設定を更新
- **認証**: 必須（スーパー管理者または該当企業の管理者）
- **パスパラメータ**:
  - `id`: 企業ID（UUID）または公開ID
- **リクエスト**:
  ```json
  {
    "workHours": {
      "startTime": "09:30",
      "endTime": "18:30",
      "breakTime": 60
    },
    "holidays": ["Saturday", "Sunday", "Friday"],
    "leavePolicy": {
      "paidLeavePerYear": 25,
      "sickLeavePerYear": 10
    }
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "workHours": {
        "startTime": "09:30",
        "endTime": "18:30",
        "breakTime": 60
      },
      "holidays": ["Saturday", "Sunday", "Friday"],
      "leavePolicy": {
        "paidLeavePerYear": 25,
        "sickLeavePerYear": 10
      }
    }
  }
  ```

### 認証API

#### ログイン
- **エンドポイント**: `POST /auth/login`
- **説明**: ユーザー認証を行い、JWTトークンを発行
- **リクエスト**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "山田太郎",
        "email": "user@example.com",
        "role": "user"
      }
    }
  }
  ```

#### ログアウト
- **エンドポイント**: `POST /auth/logout`
- **説明**: ユーザーのセッションを終了し、トークンを無効化
- **認証**: 必須
- **リクエスト**: 不要
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "message": "ログアウトしました"
    }
  }
  ```

#### トークンリフレッシュ
- **エンドポイント**: `POST /auth/refresh`
- **説明**: リフレッシュトークンを使用して新しいアクセストークンを取得
- **リクエスト**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### ユーザー管理API

#### ユーザー一覧取得
- **エンドポイント**: `GET /users`
- **説明**: ユーザー一覧を取得（管理者のみ）
- **認証**: 必須（管理者権限）
- **クエリパラメータ**:
  - `page`: ページ番号（デフォルト: 1）
  - `per_page`: 1ページあたりの件数（デフォルト: 10、最大: 100）
  - `sort`: ソート項目（name, email, created_at）
  - `order`: ソート順（asc, desc）
  - `search`: 検索キーワード
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "山田太郎",
        "email": "user1@example.com",
        "role": "user",
        "created_at": "2025-01-01T00:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "鈴木花子",
        "email": "user2@example.com",
        "role": "admin",
        "created_at": "2025-01-02T00:00:00Z"
      }
    ],
    "meta": {
      "total": 42,
      "page": 1,
      "per_page": 10,
      "total_pages": 5
    }
  }
  ```

#### 新規ユーザー作成
- **エンドポイント**: `POST /users`
- **説明**: 新しいユーザーを作成（管理者のみ）
- **認証**: 必須（管理者権限）
- **リクエスト**:
  ```json
  {
    "name": "佐藤次郎",
    "email": "user3@example.com",
    "password": "securePassword123",
    "role": "user"
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "佐藤次郎",
      "email": "user3@example.com",
      "role": "user",
      "created_at": "2025-03-14T12:34:56Z"
    }
  }
  ```

#### 特定ユーザー情報取得
- **エンドポイント**: `GET /users/:id`
- **説明**: 指定したIDのユーザー情報を取得
- **認証**: 必須（自分自身または管理者）
- **パスパラメータ**:
  - `id`: ユーザーID（UUID）
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "山田太郎",
      "email": "user1@example.com",
      "role": "user",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-10T00:00:00Z"
    }
  }
  ```

#### ユーザー情報更新
- **エンドポイント**: `PUT /users/:id`
- **説明**: 指定したIDのユーザー情報を更新
- **認証**: 必須（自分自身または管理者）
- **パスパラメータ**:
  - `id`: ユーザーID（UUID）
- **リクエスト**:
  ```json
  {
    "name": "山田太郎（更新）",
    "email": "user1-updated@example.com"
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "山田太郎（更新）",
      "email": "user1-updated@example.com",
      "role": "user",
      "updated_at": "2025-03-14T12:34:56Z"
    }
  }
  ```

#### ユーザー削除
- **エンドポイント**: `DELETE /users/:id`
- **説明**: 指定したIDのユーザーを削除
- **認証**: 必須（管理者のみ）
- **パスパラメータ**:
  - `id`: ユーザーID（UUID）
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "message": "ユーザーを削除しました"
    }
  }
  ```

### 勤怠管理API

#### 出勤打刻
- **エンドポイント**: `POST /attendance/checkin`
- **説明**: ユーザーの出勤時間を記録
- **認証**: 必須
- **リクエスト**:
  ```json
  {
    "note": "在宅勤務"  // オプション
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "checkin_time": "2025-03-14T09:00:00Z",
      "date": "2025-03-14",
      "note": "在宅勤務"
    }
  }
  ```

#### 退勤打刻
- **エンドポイント**: `POST /attendance/checkout`
- **説明**: ユーザーの退勤時間を記録
- **認証**: 必須
- **リクエスト**:
  ```json
  {
    "note": "プロジェクトA完了"  // オプション
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "checkin_time": "2025-03-14T09:00:00Z",
      "checkout_time": "2025-03-14T18:00:00Z",
      "date": "2025-03-14",
      "working_hours": 9,
      "note": "プロジェクトA完了"
    }
  }
  ```

#### 勤怠記録取得（個人）
- **エンドポイント**: `GET /attendance/me`
- **説明**: ログインユーザー自身の勤怠記録を取得
- **認証**: 必須
- **クエリパラメータ**:
  - `start_date`: 開始日（YYYY-MM-DD）
  - `end_date`: 終了日（YYYY-MM-DD）
  - `page`: ページ番号（デフォルト: 1）
  - `per_page`: 1ページあたりの件数（デフォルト: 31、最大: 100）
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "date": "2025-03-14",
        "checkin_time": "2025-03-14T09:00:00Z",
        "checkout_time": "2025-03-14T18:00:00Z",
        "working_hours": 9,
        "note": "プロジェクトA完了"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "date": "2025-03-15",
        "checkin_time": "2025-03-15T09:30:00Z",
        "checkout_time": "2025-03-15T17:30:00Z",
        "working_hours": 8,
        "note": "在宅勤務"
      }
    ],
    "meta": {
      "total": 22,
      "page": 1,
      "per_page": 31,
      "total_working_hours": 180
    }
  }
  ```

#### 特定ユーザーの勤怠記録取得（管理者用）
- **エンドポイント**: `GET /attendance/:userId`
- **説明**: 指定したユーザーの勤怠記録を取得（管理者のみ）
- **認証**: 必須（管理者権限）
- **パスパラメータ**:
  - `userId`: ユーザーID（UUID）
- **クエリパラメータ**:
  - `start_date`: 開始日（YYYY-MM-DD）
  - `end_date`: 終了日（YYYY-MM-DD）
  - `page`: ページ番号（デフォルト: 1）
  - `per_page`: 1ページあたりの件数（デフォルト: 31、最大: 100）
- **レスポンス**: `/attendance/me` と同様

#### 勤怠記録修正（管理者用）
- **エンドポイント**: `PUT /attendance/:id`
- **説明**: 特定の勤怠記録を修正（管理者のみ）
- **認証**: 必須（管理者権限）
- **パスパラメータ**:
  - `id`: 勤怠記録ID（UUID）
- **リクエスト**:
  ```json
  {
    "checkin_time": "2025-03-14T08:30:00Z",
    "checkout_time": "2025-03-14T17:30:00Z",
    "note": "修正済み"
  }
  ```
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "checkin_time": "2025-03-14T08:30:00Z",
      "checkout_time": "2025-03-14T17:30:00Z",
      "date": "2025-03-14",
      "working_hours": 9,
      "note": "修正済み",
      "updated_at": "2025-03-15T10:00:00Z",
      "modified_by": "550e8400-e29b-41d4-a716-446655440001"
    }
  }
  ```

#### 月次勤怠サマリー
- **エンドポイント**: `GET /attendance/summary/:userId`
- **説明**: 指定したユーザーの月次勤怠サマリーを取得
- **認証**: 必須（自分自身または管理者）
- **パスパラメータ**:
  - `userId`: ユーザーID（UUID）（`me`の場合は自分自身）
- **クエリパラメータ**:
  - `year`: 年（YYYY）
  - `month`: 月（MM）
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "year": 2025,
      "month": 3,
      "working_days": 20,
      "actual_working_days": 18,
      "total_working_hours": 144,
      "overtime_hours": 4,
      "late_arrival_count": 1,
      "early_departure_count": 0,
      "absent_count": 2,
      "records": [
        {
          "date": "2025-03-01",
          "day_of_week": "土",
          "is_holiday": true,
          "checkin_time": null,
          "checkout_time": null,
          "working_hours": 0
        },
        {
          "date": "2025-03-02",
          "day_of_week": "日",
          "is_holiday": true,
          "checkin_time": null,
          "checkout_time": null,
          "working_hours": 0
        },
        {
          "date": "2025-03-03",
          "day_of_week": "月",
          "is_holiday": false,
          "checkin_time": "2025-03-03T09:00:00Z",
          "checkout_time": "2025-03-03T18:00:00Z",
          "working_hours": 8
        }
        // 以下、月の全日付データ
      ]
    }
  }
  ```

### コンプライアンスレポートAPI

#### 会社全体のコンプライアンスレポート取得
- **エンドポイント**: `GET /reports/compliance/company`
- **説明**: 会社全体の労務コンプライアンスレポートを取得（管理者のみ）
- **認証**: 必須（管理者権限）
- **クエリパラメータ**:
  - `year`: 年（YYYY）
  - `month`: 月（MM）
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "period": {
        "year": 2025,
        "month": 3,
        "startDate": "2025-03-01",
        "endDate": "2025-03-31"
      },
      "companySummary": {
        "totalUsers": 15,
        "activeUsers": 14
      },
      "complianceReport": {
        "overtimeStatus": {
          "totalOvertimeHours": 120.5,
          "averageOvertimeHours": 8.03,
          "excessiveOvertimeCount": 2,
          "excessiveOvertimeRate": 13.33,
          "topOvertimeUsers": [
            {
              "userId": "550e8400-e29b-41d4-a716-446655440001",
              "name": "山田太郎",
              "overtimeHours": 48.5,
              "excessDays": 10
            },
            {
              "userId": "550e8400-e29b-41d4-a716-446655440002",
              "name": "鈴木花子",
              "overtimeHours": 46.2,
              "excessDays": 9
            }
          ]
        },
        "breakTimeStatus": {
          "totalWorkingDays": 280,
          "insufficientBreakDays": 15,
          "breakComplianceRate": 94.64,
          "insufficientBreakUsers": [
            {
              "userId": "550e8400-e29b-41d4-a716-446655440003",
              "name": "佐藤次郎",
              "workingDays": 20,
              "insufficientBreakDays": 8,
              "breakComplianceRate": 60.0
            }
          ]
        },
        "holidayWorkStatus": {
          "totalHolidayWorkDays": 12,
          "totalHolidayWorkHours": 72.5,
          "holidayWorkUsers": 3,
          "holidayWorkRate": 20.0,
          "topHolidayWorkUsers": [
            {
              "userId": "550e8400-e29b-41d4-a716-446655440004",
              "name": "田中三郎",
              "holidayWorkDays": 5,
              "holidayWorkHours": 30.0
            }
          ]
        },
        "nightWorkStatus": {
          "totalNightWorkDays": 18,
          "totalNightWorkHours": 36.5,
          "nightWorkUsers": 4,
          "nightWorkRate": 26.67,
          "topNightWorkUsers": [
            {
              "userId": "550e8400-e29b-41d4-a716-446655440005",
              "name": "伊藤四郎",
              "nightWorkDays": 6,
              "nightWorkHours": 12.5
            }
          ]
        },
        "paidLeaveStatus": {
          "totalPaidLeaveDays": 45,
          "averagePaidLeaveDays": 3.0,
          "targetAchievedUsers": 8,
          "targetAchievedRate": 53.33,
          "overallPaidLeaveRate": 60.0,
          "lowPaidLeaveUsers": [
            {
              "userId": "550e8400-e29b-41d4-a716-446655440006",
              "name": "渡辺五郎",
              "paidLeaveDays": 1,
              "paidLeaveTarget": 5,
              "remainingDays": 4
            }
          ]
        }
      }
    }
  }
  ```

#### 部門別コンプライアンスレポート取得
- **エンドポイント**: `GET /reports/compliance/department`
- **説明**: 部門別の労務コンプライアンスレポートを取得（管理者のみ）
- **認証**: 必須（管理者権限）
- **クエリパラメータ**:
  - `year`: 年（YYYY）
  - `month`: 月（MM）
  - `department`: 部門名（オプション）
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "period": {
        "year": 2025,
        "month": 3,
        "startDate": "2025-03-01",
        "endDate": "2025-03-31"
      },
      "departmentSummary": {
        "name": "開発部",
        "totalUsers": 5,
        "activeUsers": 5,
        "overtimeHours": 52.5,
        "holidayWorkDays": 4,
        "nightWorkDays": 6,
        "paidLeaveDays": 15
      },
      "userReports": [
        {
          "userId": "550e8400-e29b-41d4-a716-446655440007",
          "name": "山本六郎",
          "overtimeHours": 12.5,
          "holidayWorkDays": 1,
          "nightWorkDays": 2,
          "paidLeaveDays": 3
        }
      ]
    }
  }
  ```

#### ユーザー別コンプライアンスレポート取得
- **エンドポイント**: `GET /reports/compliance/user/:userId`
- **説明**: 特定ユーザーの労務コンプライアンスレポートを取得
- **認証**: 必須（自分自身または管理者）
- **パスパラメータ**:
  - `userId`: ユーザーID（UUID）（`me`の場合は自分自身）
- **クエリパラメータ**:
  - `year`: 年（YYYY）
  - `month`: 月（MM）
- **レスポンス**:
  ```json
  {
    "status": "success",
    "data": {
      "userId": "550e8400-e29b-41d4-a716-446655440007",
      "name": "山本六郎",
      "period": {
        "year": 2025,
        "month": 3,
        "startDate": "2025-03-01",
        "endDate": "2025-03-31"
      },
      "complianceStatus": {
        "workingDays": 20,
        "totalWorkingHours": 168.5,
        "overtimeHours": 12.5,
        "excessDays": 3,
        "holidayWorkDays": 1,
        "holidayWorkHours": 6.0,
        "nightWorkDays": 2,
        "nightWorkHours": 4.5,
        "insufficientBreakDays": 1,
        "paidLeaveDays": 3
      },
      "complianceIssues": [
        {
          "date": "2025-03-10",
          "issue": "休憩時間不足",
          "details": "8時間超勤務で休憩60分未満"
        },
        {
          "date": "2025-03-15",
          "issue": "深夜勤務",
          "details": "22時以降の勤務（22:00-23:30）"
        }
      ]
    }
  }
  ```

## エラーコード一覧

| エラーコード | 説明 |
|-------------|------|
| `AUTH_INVALID_CREDENTIALS` | 認証情報が無効です |
| `AUTH_TOKEN_EXPIRED` | 認証トークンの有効期限が切れています |
| `AUTH_INSUFFICIENT_PERMISSIONS` | アクセス権限がありません |
| `RESOURCE_NOT_FOUND` | リソースが見つかりません |
| `VALIDATION_ERROR` | 入力値が無効です |
| `DUPLICATE_RECORD` | 重複するレコードが存在します |
| `ATTENDANCE_ALREADY_CHECKED_IN` | すでに出勤打刻済みです |
| `ATTENDANCE_NOT_CHECKED_IN` | 出勤打刻されていません |
| `ATTENDANCE_ALREADY_CHECKED_OUT` | すでに退勤打刻済みです |
| `SERVER_ERROR` | サーバー内部エラー |

## Webhook

勤怠システムは以下のイベントに対してWebhookを提供します。

| イベント | 説明 |
|---------|------|
| `user.created` | ユーザーが作成された |
| `user.updated` | ユーザー情報が更新された |
| `user.deleted` | ユーザーが削除された |
| `attendance.checkin` | 出勤打刻された |
| `attendance.checkout` | 退勤打刻された |
| `attendance.modified` | 勤怠記録が修正された |

Webhook設定と詳細については管理者にお問い合わせください。

## レート制限

APIリクエストには以下のレート制限が適用されます。

- 認証API: 1分あたり10リクエスト
- その他のAPI: 1分あたり60リクエスト

制限を超えた場合は、HTTPステータスコード `429 (Too Many Requests)` が返され、以下のレスポンスが返されます。

```json
{
  "status": "error",
  "message": "リクエスト回数の上限を超えました",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 30
}
```
