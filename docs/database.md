# 勤怠管理システム データベース設計

## 基本情報

- **データベース種類**: PostgreSQL 14.0以上
- **文字コード**: UTF-8
- **照合順序**: C.UTF-8
- **タイムゾーン**: Asia/Tokyo

## テーブル設計

### companies（企業情報）

| カラム名      | 型            | 制約                  | 説明                |
|--------------|---------------|----------------------|---------------------|
| id           | UUID          | PK, NOT NULL         | プライマリーキー     |
| publicId     | VARCHAR(20)   | NOT NULL, UNIQUE     | 公開ID（ハッシュ化） |
| name         | VARCHAR(100)  | NOT NULL             | 企業名              |
| logoUrl      | VARCHAR(255)  | NULL                 | 企業ロゴURL         |
| settings     | JSONB         | NULL                 | 企業固有の設定（JSON形式）|
| createdAt    | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |
| updatedAt    | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 更新日時          |

**インデックス**:
- publicId (UNIQUE)

### users（ユーザー情報）

| カラム名      | 型            | 制約                  | 説明                |
|--------------|---------------|----------------------|---------------------|
| id           | UUID          | PK, NOT NULL         | プライマリーキー     |
| name         | VARCHAR(50)   | NOT NULL             | 氏名                |
| email        | VARCHAR(100)  | NOT NULL             | メールアドレス      |
| password     | VARCHAR(255)  | NOT NULL             | パスワード（ハッシュ）|
| role         | VARCHAR(20)   | NOT NULL, DEFAULT 'EMPLOYEE' | ユーザー権限（EMPLOYEE/ADMIN/SUPER_ADMIN）|
| companyId    | UUID          | FK, NULL             | 所属企業ID（SUPER_ADMINの場合はnull可能）|
| department_id| UUID          | FK, NULL             | 所属部署ID          |
| avatar_url   | VARCHAR(255)  | NULL                 | プロフィール画像URL  |
| employee_id  | VARCHAR(20)   | NULL, UNIQUE         | 社員番号            |
| status       | VARCHAR(20)   | NOT NULL, DEFAULT 'active' | ステータス（active/inactive/suspended）|
| last_login_at| TIMESTAMP     | NULL                 | 最終ログイン日時     |
| created_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |
| updated_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 更新日時          |
| deleted_at   | TIMESTAMP     | NULL                 | 削除日時（論理削除用）|

**インデックス**:
- email (UNIQUE)
- employee_id (UNIQUE)
- department_id
- status

### departments（部署情報）

| カラム名      | 型            | 制約                  | 説明                |
|--------------|---------------|----------------------|---------------------|
| id           | UUID          | PK, NOT NULL         | プライマリーキー     |
| name         | VARCHAR(50)   | NOT NULL             | 部署名              |
| code         | VARCHAR(20)   | NOT NULL, UNIQUE     | 部署コード          |
| manager_id   | UUID          | FK, NULL             | 部署管理者ID        |
| parent_id    | UUID          | FK, NULL             | 親部署ID            |
| created_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |
| updated_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 更新日時          |
| deleted_at   | TIMESTAMP     | NULL                 | 削除日時（論理削除用）|

**インデックス**:
- code (UNIQUE)
- manager_id
- parent_id

### attendance_records（勤怠記録）

| カラム名           | 型            | 制約                  | 説明                |
|-------------------|---------------|----------------------|---------------------|
| id                | UUID          | PK, NOT NULL         | プライマリーキー     |
| user_id           | UUID          | FK, NOT NULL         | ユーザーID（外部キー）|
| date              | DATE          | NOT NULL             | 対象日付            |
| checkin_time      | TIMESTAMP     | NULL                 | 出勤時間            |
| checkout_time     | TIMESTAMP     | NULL                 | 退勤時間            |
| break_time_minutes| INTEGER       | DEFAULT 60           | 休憩時間（分）      |
| status            | VARCHAR(20)   | NOT NULL, DEFAULT 'normal' | 出勤状態（normal/telework/holiday/paid_leave/sick_leave）|
| note              | TEXT          | NULL                 | 備考                |
| location_checkin  | VARCHAR(100)  | NULL                 | 出勤位置情報        |
| location_checkout | VARCHAR(100)  | NULL                 | 退勤位置情報        |
| modified_by       | UUID          | FK, NULL             | 修正者ID（管理者修正時）|
| modified_at       | TIMESTAMP     | NULL                 | 修正日時            |
| created_at        | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |
| updated_at        | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 更新日時          |

**インデックス**:
- user_id, date (UNIQUE)
- user_id, date
- date
- status

### leaves（休暇申請）

| カラム名      | 型            | 制約                  | 説明                |
|--------------|---------------|----------------------|---------------------|
| id           | UUID          | PK, NOT NULL         | プライマリーキー     |
| user_id      | UUID          | FK, NOT NULL         | ユーザーID（外部キー）|
| type         | VARCHAR(30)   | NOT NULL             | 休暇種別（paid_leave/sick_leave/special_leave）|
| start_date   | DATE          | NOT NULL             | 開始日              |
| end_date     | DATE          | NOT NULL             | 終了日              |
| start_time   | TIME          | NULL                 | 開始時間（半休の場合）|
| end_time     | TIME          | NULL                 | 終了時間（半休の場合）|
| days         | DECIMAL(3,1)  | NOT NULL             | 日数（半休の場合0.5）|
| reason       | TEXT          | NULL                 | 理由                |
| status       | VARCHAR(20)   | NOT NULL, DEFAULT 'pending' | 状態（pending/approved/rejected/cancelled）|
| approved_by  | UUID          | FK, NULL             | 承認者ID            |
| approved_at  | TIMESTAMP     | NULL                 | 承認日時            |
| created_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |
| updated_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 更新日時          |

**インデックス**:
- user_id
- status
- start_date, end_date
- approved_by

### leave_balances（休暇残日数）

| カラム名             | 型            | 制約                  | 説明                |
|---------------------|---------------|----------------------|---------------------|
| id                  | UUID          | PK, NOT NULL         | プライマリーキー     |
| user_id             | UUID          | FK, NOT NULL         | ユーザーID（外部キー）|
| year                | INTEGER       | NOT NULL             | 年度                |
| paid_leave_days     | DECIMAL(4,1)  | NOT NULL, DEFAULT 0  | 有給休暇残日数      |
| sick_leave_days     | DECIMAL(4,1)  | NOT NULL, DEFAULT 0  | 病気休暇残日数      |
| special_leave_days  | DECIMAL(4,1)  | NOT NULL, DEFAULT 0  | 特別休暇残日数      |
| carried_over_days   | DECIMAL(4,1)  | NOT NULL, DEFAULT 0  | 前年度繰越日数      |
| created_at          | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |
| updated_at          | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 更新日時          |

**インデックス**:
- user_id, year (UNIQUE)

### holidays（祝日・休業日）

| カラム名      | 型            | 制約                  | 説明                |
|--------------|---------------|----------------------|---------------------|
| id           | UUID          | PK, NOT NULL         | プライマリーキー     |
| date         | DATE          | NOT NULL, UNIQUE     | 日付                |
| name         | VARCHAR(100)  | NOT NULL             | 休日名称            |
| description  | TEXT          | NULL                 | 説明                |
| is_company_holiday | BOOLEAN | NOT NULL, DEFAULT false | 会社独自の休日かどうか |
| created_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |
| updated_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 更新日時          |

**インデックス**:
- date (UNIQUE)

### working_hours_settings（勤務時間設定）

| カラム名             | 型            | 制約                  | 説明                |
|---------------------|---------------|----------------------|---------------------|
| id                  | UUID          | PK, NOT NULL         | プライマリーキー     |
| department_id       | UUID          | FK, NULL             | 部署ID（NULL=全社共通）|
| standard_start_time | TIME          | NOT NULL             | 標準出勤時間        |
| standard_end_time   | TIME          | NOT NULL             | 標準退勤時間        |
| break_time_minutes  | INTEGER       | NOT NULL, DEFAULT 60 | 標準休憩時間（分）  |
| work_hours_per_day  | DECIMAL(4,2)  | NOT NULL             | 1日あたり勤務時間   |
| work_days_per_week  | INTEGER       | NOT NULL, DEFAULT 5  | 週あたり勤務日数    |
| start_day_of_week   | INTEGER       | NOT NULL, DEFAULT 1  | 週の開始曜日（1=月曜日）|
| created_at          | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |
| updated_at          | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 更新日時          |

**インデックス**:
- department_id

### notifications（通知）

| カラム名      | 型            | 制約                  | 説明                |
|--------------|---------------|----------------------|---------------------|
| id           | UUID          | PK, NOT NULL         | プライマリーキー     |
| user_id      | UUID          | FK, NOT NULL         | 通知対象ユーザーID   |
| title        | VARCHAR(100)  | NOT NULL             | 通知タイトル        |
| content      | TEXT          | NOT NULL             | 通知内容            |
| type         | VARCHAR(30)   | NOT NULL             | 通知種別（system/attendance/leave/approval）|
| is_read      | BOOLEAN       | NOT NULL, DEFAULT false | 既読フラグ        |
| read_at      | TIMESTAMP     | NULL                 | 既読日時            |
| created_at   | TIMESTAMP     | NOT NULL, DEFAULT NOW() | 作成日時          |

**インデックス**:
- user_id, is_read
- created_at

## リレーション

### 主なリレーション

1. **users → departments**
   - users.department_id → departments.id
   - ユーザーは1つの部署に所属

2. **departments → users (manager)**
   - departments.manager_id → users.id
   - 部署には1人の管理者が存在

3. **departments → departments (parent)**
   - departments.parent_id → departments.id
   - 部署は階層構造を持つ

4. **attendance_records → users**
   - attendance_records.user_id → users.id
   - ユーザーは複数の勤怠記録を持つ

5. **attendance_records → users (modifier)**
   - attendance_records.modified_by → users.id
   - 勤怠記録の修正者を追跡

6. **leaves → users**
   - leaves.user_id → users.id
   - ユーザーは複数の休暇申請を持つ

7. **leaves → users (approver)**
   - leaves.approved_by → users.id
   - 休暇申請の承認者を追跡

8. **leave_balances → users**
   - leave_balances.user_id → users.id
   - ユーザーは年度ごとの休暇残日数を持つ

9. **working_hours_settings → departments**
   - working_hours_settings.department_id → departments.id
   - 部署ごとに勤務時間設定が可能

10. **notifications → users**
    - notifications.user_id → users.id
    - ユーザーは複数の通知を受け取る

## 制約と考慮事項

1. **論理削除**
   - users, departmentsテーブルは論理削除を採用（deleted_atカラム）
   - 関連データの整合性のため物理削除は避ける

2. **ユニーク制約**
   - attendance_recordsは1ユーザーにつき1日1レコード
   - leave_balancesは1ユーザーにつき年度ごとに1レコード

3. **外部キー制約**
   - 全ての外部キー参照はON DELETE RESTRICTを採用
   - 誤削除による整合性崩壊を防止

4. **インデックス最適化**
   - 頻繁に検索される条件をカバーするインデックスを設定
   - 特に日付範囲検索のパフォーマンスを考慮
