# Recipe Importer Library

JSONデータからSupabaseデータベースにレシピをインポートするためのライブラリです。

## 使い方

### 基本的な使用例

```typescript
import { createRecipeImporter, type RecipeJSON } from './lib/recipeImporter.js';

// Supabase接続情報
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'your-anon-key';

// インポーター作成
const importer = createRecipeImporter(supabaseUrl, supabaseKey);

// レシピJSONデータ
const recipeData: RecipeJSON = {
  recipes: [
    {
      title: "サンプルレシピ",
      description: "これはサンプルです",
      category: "主菜",
      servings: "2人分",
      tags: ["和風", "簡単"],
      ingredients: [
        {
          original_name: "鶏肉",
          normalized_name: "とりにく",
          canonical_name: "鶏肉",
          group_name: "肉",
          amount: "200g",
          note: null
        }
      ],
      steps: [
        "鶏肉を切る",
        "焼く"
      ]
    }
  ]
};

// インポート実行
try {
  const recipeIds = await importer.importRecipes(recipeData);
  console.log('インポート成功:', recipeIds);
} catch (error) {
  console.error('インポート失敗:', error);
}
```

### エラーハンドリング付きインポート

```typescript
// 各レシピの成功/失敗を個別に取得
const results = await importer.importRecipesWithResults(recipeData);

for (const result of results) {
  if (result.success) {
    console.log(`✅ ${result.recipeTitle} - ID: ${result.recipeId}`);
  } else {
    console.log(`❌ ${result.recipeTitle} - Error: ${result.error}`);
  }
}
```

### 単一レシピのインポート

```typescript
const recipe = {
  title: "カレーライス",
  description: "スパイシーなカレー",
  category: "主菜",
  tags: ["洋風", "カレー"],
  ingredients: [
    {
      original_name: "カレールー",
      normalized_name: "かれーるー",
      canonical_name: "カレールー",
      group_name: "調味料",
      amount: "1箱",
      note: null
    }
  ],
  steps: ["材料を切る", "煮込む"]
};

const recipeId = await importer.importRecipe(recipe);
console.log('レシピID:', recipeId);
```

## API

### `createRecipeImporter(supabaseUrl, supabaseKey)`

RecipeImporterインスタンスを作成します。

**パラメータ:**
- `supabaseUrl` (string): Supabase プロジェクトURL
- `supabaseKey` (string): Supabase anon key

**戻り値:**
- `RecipeImporter`: インポーターインスタンス

---

### `importer.importRecipe(recipe)`

単一のレシピをインポートします。

**パラメータ:**
- `recipe` (RecipeData): レシピデータ

**戻り値:**
- `Promise<number>`: インポートされたレシピのID

**例外:**
- エラーが発生した場合は例外をスロー

---

### `importer.importRecipes(recipeJSON)`

複数のレシピをインポートします。

**パラメータ:**
- `recipeJSON` (RecipeJSON): レシピJSONオブジェクト

**戻り値:**
- `Promise<number[]>`: インポートされたレシピIDの配列

**例外:**
- いずれかのレシピでエラーが発生した場合は例外をスロー

---

### `importer.importRecipesWithResults(recipeJSON)`

複数のレシピをインポートし、各レシピの結果を返します。

**パラメータ:**
- `recipeJSON` (RecipeJSON): レシピJSONオブジェクト

**戻り値:**
- `Promise<Array<{ success: boolean; recipeTitle: string; recipeId?: number; error?: string }>>`: 各レシピの結果

---

## データ型

### RecipeJSON

```typescript
interface RecipeJSON {
  recipes: RecipeData[];
}
```

### RecipeData

```typescript
interface RecipeData {
  title: string;
  description: string | null;
  category: string | null;
  servings?: string | null;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
}
```

### RecipeIngredient

```typescript
interface RecipeIngredient {
  original_name: string;       // 元の材料名
  normalized_name: string;     // 正規化された名前（ひらがな）
  canonical_name: string;      // 標準名
  group_name: string;          // 分類（肉、野菜など）
  amount: string | null;       // 分量
  note: string | null;         // 備考
}
```

## 処理の流れ

1. **ingredients（食材）のupsert**
   - `canonical_name` + `normalized_name` で既存チェック
   - 存在しない場合は新規追加

2. **tags（タグ）のupsert**
   - `name`（unique）で既存チェック
   - 存在しない場合は新規追加

3. **recipesの追加**
   - レシピ本体をinsert
   - `steps`配列は改行で結合して`steps_text`に保存

4. **recipe_ingredientsの追加**
   - レシピと食材を紐づけ

5. **recipe_tagsの追加**
   - レシピとタグを紐づけ

## 注意事項

- 食材とタグは自動的にupsert（既存チェック＋追加）されます
- 同じ食材・タグが複数のレシピで使用される場合、自動的に共有されます
- トランザクションは使用していないため、途中でエラーが発生した場合、部分的にデータが残る可能性があります
