# Recipe Search API

レシピ検索APIの実装とドキュメント

## 概要

このAPIは、Supabaseデータベースに保存されたレシピを検索する機能を提供します。

- **AND検索**: 複数のキーワードを指定すると、すべてのキーワードにマッチするレシピのみを返します
- **柔軟なマッチング**: 材料名、タグ、レシピのタイトル・説明・カテゴリから検索
- **正規化**: 全角・半角スペースに対応

## 使い方

### コマンドラインから検索

```bash
# 単一キーワード
npm run search -- 鶏肉

# 複数キーワード（AND検索）
npm run search -- 鶏肉 ヘルシー

# タグで検索
npm run search -- 和風

# カテゴリと材料で検索
npm run search -- 主菜 牛肉
```

### TypeScriptコードから使用

```typescript
import { searchRecipesByQuery } from './lib/recipeSearch.js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

// 検索実行
const results = await searchRecipesByQuery(
  '鶏肉 ヘルシー',
  supabaseUrl,
  supabaseKey
);

console.log(`Found ${results.length} recipes`);
results.forEach(recipe => {
  console.log(`- ${recipe.title}`);
});
```

### クラスベースの使用

```typescript
import { RecipeSearch } from './lib/recipeSearch.js';

const searcher = new RecipeSearch(supabaseUrl, supabaseKey);
const results = await searcher.searchRecipesByQuery('トマト さっぱり');
```

## API型定義

### RecipeSearchResult

```typescript
type RecipeSearchResult = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
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

## 検索ロジック

### トークン分割

検索クエリは以下のように処理されます：

1. 全角スペースを半角スペースに変換
2. スペースで分割
3. 空文字を除外

例: `"鶏肉　ヘルシー"` → `["鶏肉", "ヘルシー"]`

### マッチング条件

各トークンについて、以下のいずれかにマッチすればOK：

1. **材料名**
   - `ingredients.canonical_name ILIKE '%token%'`
   - `ingredients.normalized_name ILIKE '%token%'`

2. **タグ名**
   - `tags.name ILIKE '%token%'`
   - `tags.normalized_name ILIKE '%token%'`

3. **レシピ本体**
   - `recipes.title ILIKE '%token%'`
   - `recipes.description ILIKE '%token%'`
   - `recipes.category ILIKE '%token%'`

### AND検索

複数のトークンが指定された場合、**すべてのトークンにマッチするレシピのみ**を返します。

例:
- `"鶏肉 ヘルシー"` → 「鶏肉」にマッチ **かつ** 「ヘルシー」にマッチ
- `"主菜 牛肉 トマト"` → すべてにマッチするレシピのみ

## Expressでの使用例

```typescript
import express from 'express';
import { createExpressHandler } from './api/searchRecipes.js';

const app = express();
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

app.get('/api/recipes/search', createExpressHandler(supabaseUrl, supabaseKey));

app.listen(3000);

// GET /api/recipes/search?q=鶏肉
// GET /api/recipes/search?query=主菜 牛肉
```

## Next.jsでの使用例

`pages/api/recipes/search.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { createNextApiHandler } from '@/lib/api/searchRecipes';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export default createNextApiHandler(supabaseUrl, supabaseKey);
```

## レスポンス例

### 成功時

```json
{
  "success": true,
  "query": "鶏肉",
  "data": [
    {
      "id": 4,
      "title": "鶏もも肉の赤ワイン煮込み",
      "description": "赤ワインでじっくり煮込んだ...",
      "category": "主菜",
      "created_at": "2025-11-15T08:30:00.000Z",
      "tags": [
        { "id": 1, "name": "洋風" },
        { "id": 2, "name": "鶏肉" }
      ],
      "ingredients": [
        {
          "id": 1,
          "original_name": "鶏もも肉",
          "canonical_name": "鶏もも肉",
          "amount": "1枚"
        }
      ]
    }
  ]
}
```

### エラー時

```json
{
  "success": false,
  "error": "Query parameter is required",
  "query": ""
}
```

## パフォーマンス最適化

### 実装アプローチ

現在の実装は「パターンB」を採用：

1. 各トークンについて、マッチする `recipe_id` のセットを取得
2. すべてのセットの積集合を計算（AND検索）
3. 最終的な `recipe_id` リストで詳細データを取得

このアプローチにより：
- 複雑なJOINを避け、クエリがシンプル
- 各トークンの検索を並列実行可能
- デバッグとメンテナンスが容易

### インデックス

以下のインデックスが作成されています：

- `ingredients.normalized_name`
- `tags.normalized_name`
- `recipes.created_at`
- `recipe_ingredients.recipe_id`
- `recipe_tags.recipe_id`

## エラーハンドリング

- 空の検索クエリ → 空配列を返す
- Supabaseエラー → コンソールにログ出力 + エラーをthrow
- 不正なクエリ → 空配列を返す

## テスト

```bash
# 単一キーワード
npm run search -- 鶏肉

# 複数キーワード
npm run search -- レンコン 豚肉

# タグ検索
npm run search -- 和風

# カテゴリ + 材料
npm run search -- 主菜 牛肉
```
