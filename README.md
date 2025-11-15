# Recipe Management - Supabase Local Development

レシピ管理アプリのためのSupabaseローカル開発環境

## 📋 必要要件

- Node.js 18以上
- Docker Desktop（Supabaseローカル環境に必要）
- npm または yarn

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseローカル環境の起動

初回起動時はDockerイメージのダウンロードに時間がかかります。

```bash
npm run supabase:start
```

起動が完了すると、以下の情報が表示されます：
- API URL: `http://127.0.0.1:54321`
- Studio URL: `http://127.0.0.1:54323`
- Inbucket URL: `http://127.0.0.1:54324`（メールテスト用）

### 3. Supabase Studioを開く

```bash
npm run supabase:studio
```

ブラウザで `http://127.0.0.1:54323` が開き、データベースの内容を確認できます。

### 4. 既存プロジェクトとのリンク（オプション）

既存のSupabaseプロジェクト（`uhtvjhcludivyltnlusg`）とリンクする場合：

```bash
# Supabaseにログイン
npx supabase login

# プロジェクトとリンク
npm run supabase:link
```

または手動でリンク：

```bash
npx supabase link --project-ref uhtvjhcludivyltnlusg
```

## 📦 データベーススキーマ

以下の5つのテーブルが作成されます：

### 1. `recipes`
レシピの基本情報

| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigserial | 主キー |
| title | text | レシピ名 |
| description | text | 説明 |
| steps_text | text | 手順 |
| source_image_url | text | 画像URL |
| category | text | カテゴリ |
| created_at | timestamptz | 作成日時 |

### 2. `ingredients`
食材マスタ

| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigserial | 主キー |
| canonical_name | text | 正式名称 |
| normalized_name | text | 正規化名称（検索用） |
| group_name | text | グループ名（肉、野菜など） |

### 3. `recipe_ingredients`
レシピと食材の紐づけ

| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigserial | 主キー |
| recipe_id | bigint | レシピID（FK） |
| ingredient_id | bigint | 食材ID（FK、NULL可） |
| original_name | text | 元のテキスト |
| amount | text | 分量 |
| note | text | 備考 |

### 4. `tags`
タグマスタ

| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigserial | 主キー |
| name | text | タグ名（ユニーク） |
| normalized_name | text | 正規化名称 |
| description | text | 説明 |
| sort_order | int | 表示順 |

### 5. `recipe_tags`
レシピとタグの多対多関係

| カラム | 型 | 説明 |
|--------|-----|------|
| id | bigserial | 主キー |
| recipe_id | bigint | レシピID（FK） |
| tag_id | bigint | タグID（FK） |

## 🛠️ 利用可能なコマンド

### ローカル環境の操作

```bash
# ローカルSupabaseを起動
npm run supabase:start

# ローカルSupabaseを停止
npm run supabase:stop

# データベースをリセット（全データ削除 + マイグレーション再実行）
npm run supabase:reset

# Supabase Studioを開く
npm run supabase:studio

# ステータス確認
npm run supabase:status
```

### マイグレーション関連

```bash
# 新しいマイグレーションファイルを作成
npm run supabase:migration:new <migration_name>

# 例：
npm run supabase:migration:new add_user_table
```

### リモートプロジェクトとの連携

```bash
# プロジェクトとリンク
npm run supabase:link

# ローカルのマイグレーションをリモートにプッシュ
npm run supabase:db:push
```

### レシピ抽出（画像 → JSON）

```bash
# screenshotsフォルダの画像からレシピデータを抽出してJSONに変換
npm run extract
```

**前提条件:**
- `.env`ファイルに`ANTHROPIC_API_KEY`を設定
- `/screenshots`フォルダに画像を配置

**動作:**
1. `screenshots`フォルダから`done_`プレフィックスがない画像を処理
2. Claude APIで画像を解析してレシピデータを抽出
3. `/seed`フォルダにJSON形式で保存
4. 処理済み画像に`done_`プレフィックスを付与

### データインポート（JSON → DB）

```bash
# Supabase型定義を生成（マイグレーション後に実行）
npm run supabase:gen:types

# seedフォルダのJSONデータをデータベースにインポート
npm run seed
```

**動作:**
1. `seed`フォルダから`done_`プレフィックスがないJSONファイルを処理
2. Supabaseデータベースにレシピをインポート
3. 処理済みJSONに`done_`プレフィックスを付与

## 📝 開発フロー

### 1. ローカル開発

```bash
# 1. Supabaseを起動
npm run supabase:start

# 2. Studioで確認
npm run supabase:studio

# 3. 開発作業...

# 4. 終了時
npm run supabase:stop
```

### 2. スキーマ変更

```bash
# 1. 新しいマイグレーションファイルを作成
npm run supabase:migration:new my_changes

# 2. supabase/migrations/にできたSQLファイルを編集

# 3. マイグレーションを適用（DBリセット）
npm run supabase:reset

# 4. Studioで確認
npm run supabase:studio
```

### 3. データインポート（初回のみ）

```bash
# 1. Supabase型定義を生成
npm run supabase:gen:types

# 2. /seedフォルダのJSONデータをインポート
npm run seed
```

seedフォルダに配置されたレシピJSONファイルが自動的にデータベースに登録されます。
- ingredients（食材）は自動的にupsert（既存チェック＋追加）
- tags（タグ）も自動的にupsert
- recipes、recipe_ingredients、recipe_tagsが正しく関連付けされて登録

### 4. リモートへのデプロイ

```bash
# 1. プロジェクトとリンク（初回のみ）
npm run supabase:link

# 2. マイグレーションをプッシュ
npm run supabase:db:push
```

## 🔧 トラブルシューティング

### Dockerが起動しない
- Docker Desktopが起動しているか確認してください

### ポートが既に使用されている
- `supabase/config.toml` でポート番号を変更できます

### マイグレーションエラー
```bash
# DBをリセットして最初からやり直す
npm run supabase:stop
npm run supabase:start
npm run supabase:reset
```

## 📚 参考リンク

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📄 ライセンス

MIT
