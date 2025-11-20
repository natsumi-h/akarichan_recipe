あなたは Supabase + TypeScript を使ったバックエンド実装に精通したシニアエンジニアです。

これから、/seedにあるレシピデータをもとに、
私が構築した Supabase データベースへ登録するための **TypeScript 関数** を作成してください。

JSON から Supabase の以下 5 テーブルに正しく INSERT / UPSERT する必要があります：

- recipes
- ingredients
- recipe_ingredients
- tags
- recipe_tags

---

# 🎯 ゴール

以下の処理を行う **完璧に動作する TypeScript 関数（または複数関数）** を生成してください：

1. /seed内に存在するjsonデータを順番に処理する
2. ingredients の canonical_name / normalized_name / group_name を基準に **既存チェック → upsert**
3. tags の name / normalized_name を基準に **既存チェック → upsert**
4. recipe を追加
5. recipe_ingredients を追加（ingredient_id を正しく参照）
6. recipe_tags を追加（tag_id を正しく参照）
7. 全処理を1つのレシピごとに **トランザクション的に** 実行（失敗時は途中で中断）
8. 型安全な実装（Supabase TypeScript types を使用）

---

# 📦 JSON のフォーマット（入力）

入力される JSON は以下の形式：

```json
{
  "recipes": [
    {
      "title": "string",
      "description": "string or null",
      "category": "string or null",
      "servings": "string or null",
      "tags": ["string", "..."],
      "ingredients": [
        {
          "original_name": "string",
          "normalized_name": "string",
          "canonical_name": "string",
          "group_name": "string",
          "amount": "string or null",
          "note": "string or null"
        }
      ],
      "steps": ["string", "..."]
    }
  ]
}
```

## 🛢️ DB テーブル構造（Supabase）

### **recipes**
- id (bigserial PK)
- title (text)
- description (text or null)
- category (text or null)
- servings (text or null)
- steps_text (text) — steps 配列を "\n" 結合したもの
- source_image_url (text, null 可)
- created_at (timestamptz, default now())

---

### **ingredients**
- id (bigserial PK)
- canonical_name (text)
- normalized_name (text)
- group_name (text)
- created_at (timestamptz, default now())

---

### **recipe_ingredients**
- id (bigserial PK)
- recipe_id (FK → recipes.id)
- ingredient_id (FK → ingredients.id)
- original_name (text)
- amount (text or null)
- note (text or null)

---

### **tags**
- id (bigserial PK)
- name (text, unique)
- normalized_name (text)
- description (text or null)
- sort_order (int, default 0)
- created_at (timestamptz, default now())

---

### **recipe_tags**
- id (bigserial PK)
- recipe_id (FK → recipes.id)
- tag_id (FK → tags.id)

---

## 🔍 要求仕様（必ず守ること）

### **ingredients の処理**
- canonical_name + normalized_name をキーに既存チェック
- あればその ingredient.id を返す
- なければ新規 insert（group_name も保存）

### **tags の処理**
- name（unique）をキーに既存チェック
- normalized_name はひらがな変換で OK
- なければ新規 insert

### **recipes の処理**
- steps は配列 → `steps_text` に `join("\n")` で保存
- description / category / servings は null のまま保存してよい

### **recipe_ingredients の処理**
- ingredient_id は ingredients の upsert 結果
- original_name / amount / note を保存

### **recipe_tags の処理**
- tag_id は tags の upsert 結果

---

## ⚠️ エラーハンドリング
- 各レシピの処理は try/catch で囲み、失敗した場合はそのレシピのみ中断
- 明確にどのフェーズで失敗したかログする

---

## 🧩 コード品質要件
- Supabase JS Client を使用
- TypeScript で型厳密
- async/await を使用
- 必要に応じて関数分割（upsertIngredient, upsertTag など）
- Promise.all を使いすぎず、トランザクション的安全性を担保

---

## 📤 最終出力形式
生成するコードは以下を含むこと：
1. `import` 含む TypeScript の完全なソースコード  
2. 実行用の `main()` 例（任意）  
3. すぐに Supabase プロジェクトで動作する状態

---

以上の仕様に従い、JSON から Supabase DB へレコードを生成する TypeScript 関数を作成してください。
