あなたは Supabase + TypeScript で API を実装するのが得意なシニアバックエンドエンジニアです。

これから、以下のスキーマを持った Supabase DB に対して、  
**検索ワードにもとづいてレシピ一覧を取得する API（TypeScript 関数 or API ハンドラ）** を実装してください。

---

## 🛢 DB テーブル構造（Supabase）

### recipes
- id (bigserial PK)
- title (text)
- description (text or null)
- category (text or null)
- servings (text or null)
- steps_text (text)
- source_image_url (text or null)
- created_at (timestamptz, default now())

### ingredients
- id (bigserial PK)
- canonical_name (text)
- normalized_name (text)
- group_name (text)

### recipe_ingredients
- id (bigserial PK)
- recipe_id (bigint FK → recipes.id)
- ingredient_id (bigint FK → ingredients.id)
- original_name (text)
- amount (text or null)
- note (text or null)

### tags
- id (bigserial PK)
- name (text, unique)
- normalized_name (text)
- description (text or null)
- sort_order (int, default 0)

### recipe_tags
- id (bigserial PK)
- recipe_id (bigint FK → recipes.id)
- tag_id (bigint FK → tags.id)

---

## 🎯 やりたいこと：検索 API の仕様

検索ワード（日本語文字列）を受け取り、  
**レシピ一覧を検索して返す関数 or API** を実装してください。

### 入力

- 文字列 `query: string`
  - 例:
    - `"鶏むね ヘルシー"`
    - `"牛肉 カレー"`
    - `"トマト 副菜 さっぱり"`

### 検索ワードの前提

- 検索ワードは **スペース区切りで複数入る可能性**があります。
  - 例: `"鶏むね ヘルシー カレー"`
- 各トークン（単語）は、以下のいずれかとして解釈される可能性があります：
  - 材料名（ingredients）
  - タグ（tags）："ヘルシー", "さっぱり", "和風" 等
  - レシピ名・説明・カテゴリの一部："カレー", "丼", "味噌汁" 等

---

## 🔍 検索ロジックの要件

### 1. クエリの分割

- `query` をスペース（半角/全角）で分割し、**トークン配列**にしてください。
  - 例: `"鶏むね ヘルシー カレー"` → `["鶏むね", "ヘルシー", "カレー"]`
- 空文字は除外してください。

### 2. 各トークンに対する「マッチ条件」

各トークン `token` について、以下のいずれかを満たせば「そのトークンにマッチしたレシピ」と見なします：

1. **材料名でのマッチ**
   - `ingredients.canonical_name ILIKE '%token%'`
   - または、`ingredients.normalized_name` と簡易正規化した token（例：ひらがな）で比較してもよいです。
   - 一致した ingredients を使って、`recipe_ingredients` 経由で recipes を絞り込む。

2. **タグ名でのマッチ**
   - `tags.name ILIKE '%token%'`
   - または、`tags.normalized_name` と正規化した token を比較。
   - 一致した tags を使って、`recipe_tags` 経由で recipes を絞り込む。

3. **レシピタイトル・説明・カテゴリでのマッチ**
   - `recipes.title ILIKE '%token%'`
   - OR `recipes.description ILIKE '%token%'`
   - OR `recipes.category ILIKE '%token%'`

### 3. AND 条件

- 全体の検索は **AND 検索** とします。
- つまり、トークンごとに「このレシピは token にマッチしているか？」を判定し、
  - **すべてのトークンに対してマッチしたレシピだけを返す** ようにしてください。

イメージ：

- `"鶏むね ヘルシー"`  
  → 鶏むね（材料 OR タイトルなど）にもマッチし、  
    かつヘルシー（タグ OR タイトル/説明）にもマッチするレシピ。

---

## 🧠 クエリ構築の方針（実装イメージ）

以下のどちらの設計でも構いません（やりやすい方を採用してください）：

### パターン A: 1クエリで完結させる（JOIN + GROUP BY）

- recipes を基点に、
  - `LEFT JOIN recipe_ingredients → ingredients`
  - `LEFT JOIN recipe_tags → tags`
- 各 token ごとに `WHERE` or `HAVING` 条件を積み上げる
- `GROUP BY recipes.id`
- 「マッチした token の数 >= トークン数」という HAVING 条件で AND を表現

### パターン B: トークンごとに recipe の id セットを作って最後に積集合を取る

- 各 token について：
  - ingredients 経由でマッチした recipe_id の集合
  - tags 経由でマッチした recipe_id の集合
  - recipes タイトル・説明・カテゴリでマッチした recipe_id の集合
- それらを統合して「その token にマッチする recipe_id 集合」を得る
- トークンごとに集合を作り、最後に **積集合（ intersection ）** を取って共通の recipe_id を得る
- 最後に `recipes` テーブルから `WHERE id IN (...)` で取得

パフォーマンスや実装のしやすさを考えて、適切なアプローチを選んでください。

---

## 🧾 戻り値の形（レスポンス）

TypeScript で以下のような形の配列を返してください（例）：

```ts
type RecipeSearchResult = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  servings: string | null;
  created_at: string;
  tags: { id: number; name: string }[];
  ingredients: {
    id: number | null;              // ingredient_id (マスタになければ null)
    original_name: string;
    canonical_name: string | null;  // join できれば
    amount: string | null;
  }[];
};
```

* API ハンドラの場合は、JSON でこの配列を返す形で実装してください。

## 🧩 実装要件

- Supabase JS Client（`@supabase/supabase-js`）を使用して実装すること  
- TypeScript で型安全に記述すること  
- 関数は次のようなシグネチャを持つこと：

```ts
async function searchRecipesByQuery(query: string): Promise<RecipeSearchResult[]> {
  // ...
}
```

- 検索ワードは **スペース（半角・全角）で分割**し、空文字は除外すること。

- 分割した各トークンについて、次のいずれかにマッチしたレシピを候補とすること：

  1. **材料（ingredients）**
     - `ingredients.canonical_name ILIKE '%token%'`
     - または `ingredients.normalized_name` とトークンを正規化した値の比較

  2. **タグ（tags）**
     - `tags.name ILIKE '%token%'`
     - または `tags.normalized_name` との比較

  3. **レシピ本体（recipes）**
     - `recipes.title ILIKE '%token%'`
     - `recipes.description ILIKE '%token%'`
     - `recipes.category ILIKE '%token%'`

- 全トークンにマッチしたレシピだけを返すこと  
  → **AND 検索**を実現すること。

- 日本語の簡易正規化（例：カタカナ → ひらがな変換）は必要に応じて実装してよい。  
  （簡易実装または疑似コードでも可）

- JOIN して 1クエリで絞り込んでもよいし、  
  「トークンごとに recipe_id の集合を作り、最後に積集合を取る」実装でもよい。  
  → パフォーマンスと可読性を考慮して最適な方法を選んでよい。

- レスポンスは `RecipeSearchResult[]` 型とする：

  ```ts
  type RecipeSearchResult = {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    servings: string | null;
    created_at: string;
    tags: { id: number; name: string }[];
    ingredients: {
      id: number | null;
      original_name: string;
      canonical_name: string | null;
      amount: string | null;
    }[];
  };
  ```

- API ハンドラとして実装する場合は、この配列を JSON として返すこと。

- Tag や ingredients は JOIN 結果をネストしたオブジェクト配列として含めること。

- 並び順は以下のいずれかを提案するが、あなたの裁量で選んでよい：

- created_at DESC

- マッチ数順（token ごとの一致カウント）

- title の昇順など

以上の要件を満たすように、検索ワードにもとづいてレシピを取得する API／関数を実装してください。



## エラーハンドリング

空文字やトークンなしの場合は、適切な挙動を定義してください（例：空配列を返す）。

Supabase のエラーは console.error に詳細を出しつつ、呼び出し側で扱いやすいようにエラーを throw するか、空配列を返すか、あなたなりのベストプラクティスで実装してください。