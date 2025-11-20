あなたは Supabase と Node.js に詳しいフルスタックエンジニア兼アーキテクトです。
これから、ローカル開発環境で Supabase CLI を使って DB スキーマを管理する小さなレシピ管理プロジェクトのリポジトリを作りたいです。
すでにprojectはSupabseのアカウント内に存在するので、そちらと紐づけたいです。
必要であればprojectの情報をお渡しするので、教えて下さい。

---

## 🎯 ゴール

新規 Git リポジトリを前提に、以下をすべて「ローカルから CLI」で構築してください。

- Supabase CLI を使ったローカル開発環境
- DB スキーマをマイグレーションで管理する構成（`supabase/migrations`）
- 以下 5 テーブルを作成する：

### 1. `recipes`
レシピそのものの情報。

| カラム | 型 | 備考 |
|-------|----|------|
| id | bigserial PK |
| title | text not null |
| description | text |
| steps_text | text |
| source_image_url | text |
| category | text | ※とりあえず TEXT。後でマスタ化しても良い |
| created_at | timestamptz default now() |

---

### 2. `ingredients`（食材マスタ）
表記揺れを統合し、検索に使いやすくするための食材マスタ。

| カラム | 型 | 備考 |
|-------|----|------|
| id | bigserial PK |
| canonical_name | text not null | 例：牛肉、トマト、しょうゆ |
| normalized_name | text not null | 例：ぎゅうにく、とまと、しょうゆ |
| group_name | text not null | 肉、野菜、調味料、魚介など |

---

### 3. `recipe_ingredients`
1つのレシピに紐づく「材料行」。

| カラム | 型 | 備考 |
|-------|----|------|
| id | bigserial PK |
| recipe_id | bigint FK → recipes(id) ON DELETE CASCADE |
| ingredient_id | bigint FK → ingredients(id) NULL 可 |
| original_name | text not null | OCR/LLM の元テキスト |
| amount | text | 例: 180g、1/2枚 |
| note | text | 例：A、下味用など |

---

### 4. `tags`（タグマスタ）
レシピに自由につけるキーワード分類。

| カラム | 型 | 備考 |
|-------|----|------|
| id | bigserial PK |
| name | text unique not null | 表示名：ヘルシー、和風など |
| normalized_name | text not null | へるしー、わふう など |
| description | text |
| sort_order | int default 0 |

---

### 5. `recipe_tags`（中間テーブル）
レシピとタグの多対多を管理。

| カラム | 型 | 備考 |
|-------|----|------|
| id | bigserial PK |
| recipe_id | bigint not null FK → recipes(id) ON DELETE CASCADE |
| tag_id | bigint not null FK → tags(id) ON DELETE CASCADE |

---

---

## 🧩 やってほしいこと（具体的な依頼）

### 1. 空のプロジェクトに必要なコマンドを順番に示してください

例：
- `npm init`
- `npm add -D supabase`
- `npx supabase init`
- `supabase start`
など。

---

### 2. `package.json`（scripts 含む）の具体例を提示してください

最低限欲しいスクリプト：

- `"supabase:start"`：ローカル Supabase 起動  
- `"supabase:stop"`  
- `"supabase:reset"`：DB初期化＋マイグレーション適用  
- `"supabase:studio"`：Supabase Studio 起動（あれば）

---

### 3. Supabase CLI の設定ファイル（`supabase/config.toml`）例を提示してください

必要ならローカル開発用の推奨設定を提案してください。

---

### 4. マイグレーションファイルの内容を提示してください

以下すべてを含む SQL を記述してください。

- CREATE TABLE recipes
- CREATE TABLE ingredients
- CREATE TABLE recipe_ingredients
- CREATE TABLE tags
- CREATE TABLE recipe_tags

外部キー制約も含めてください。

---

### 5. ローカルの Supabase を起動し、DB を初期化してマイグレーションを適用するための npm スクリプトと実行コマンド例を示してください

例：

```bash
npm supabase:start
npm supabase:reset
