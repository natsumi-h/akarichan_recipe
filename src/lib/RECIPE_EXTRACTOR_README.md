# Recipe Extractor Library

画像からレシピデータを抽出してJSON形式に変換するためのライブラリです。Anthropic Claude APIを使用して画像を解析します。

## 使い方

### 基本的な使用例

```typescript
import { createRecipeExtractor } from './lib/recipeExtractor.js';

// API キーでエクストラクター作成
const extractor = createRecipeExtractor('your-anthropic-api-key');

// 画像からレシピを抽出
const imagePath = '/path/to/recipe-image.jpg';
const recipeData = await extractor.extractRecipeFromImage(imagePath);

console.log('抽出されたレシピ:', recipeData);
```

### 抽出されるデータ構造

```typescript
{
  "recipes": [
    {
      "title": "レシピ名",
      "description": "説明文",
      "category": "主菜",
      "servings": "2人分",
      "tags": ["和風", "簡単", "ヘルシー"],
      "ingredients": [
        {
          "original_name": "鶏もも肉",
          "normalized_name": "とりももにく",
          "canonical_name": "鶏肉",
          "group_name": "肉",
          "amount": "200g",
          "note": null
        }
      ],
      "steps": [
        "材料を切る",
        "炒める",
        "完成"
      ]
    }
  ]
}
```

## API

### `createRecipeExtractor(apiKey)`

RecipeExtractorインスタンスを作成します。

**パラメータ:**
- `apiKey` (string): Anthropic API key

**戻り値:**
- `RecipeExtractor`: エクストラクターインスタンス

---

### `extractor.extractRecipeFromImage(imagePath)`

画像からレシピデータを抽出します。

**パラメータ:**
- `imagePath` (string): 画像ファイルのパス

**戻り値:**
- `Promise<RecipeJSON>`: 抽出されたレシピデータ

**サポートされる画像形式:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**例外:**
- APIエラーが発生した場合は例外をスロー
- JSONパースに失敗した場合は例外をスロー

## 使用例

### 単一画像の処理

```typescript
import { createRecipeExtractor } from './lib/recipeExtractor.js';

async function processImage() {
  const extractor = createRecipeExtractor(process.env.ANTHROPIC_API_KEY!);

  try {
    const result = await extractor.extractRecipeFromImage('./screenshots/recipe.jpg');

    console.log(`抽出されたレシピ数: ${result.recipes.length}`);

    for (const recipe of result.recipes) {
      console.log(`- ${recipe.title}`);
      console.log(`  材料: ${recipe.ingredients.length}個`);
      console.log(`  手順: ${recipe.steps.length}ステップ`);
    }
  } catch (error) {
    console.error('抽出失敗:', error);
  }
}
```

### 複数画像の一括処理

```typescript
import { createRecipeExtractor } from './lib/recipeExtractor.js';
import { readdirSync } from 'fs';
import { join } from 'path';

async function processMultipleImages() {
  const extractor = createRecipeExtractor(process.env.ANTHROPIC_API_KEY!);
  const screenshotsDir = './screenshots';

  const imageFiles = readdirSync(screenshotsDir)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i));

  for (const file of imageFiles) {
    const imagePath = join(screenshotsDir, file);

    try {
      const result = await extractor.extractRecipeFromImage(imagePath);
      console.log(`✅ ${file}: ${result.recipes.length}件のレシピを抽出`);
    } catch (error) {
      console.error(`❌ ${file}: 抽出失敗`);
    }
  }
}
```

## 注意事項

### API制限

- Anthropic APIには使用量制限があります
- 大量の画像を処理する場合は、レート制限に注意してください
- APIキーの管理に注意してください（.envファイルで管理推奨）

### 画像の品質

- 鮮明な画像ほど抽出精度が向上します
- 手書きのレシピよりも印刷されたレシピの方が精度が高くなります
- 1枚の画像に複数のレシピがある場合、すべて抽出されます

### エラーハンドリング

```typescript
try {
  const result = await extractor.extractRecipeFromImage(imagePath);
  // 処理...
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('No JSON found')) {
      console.error('JSONが見つかりませんでした');
    } else if (error.message.includes('API')) {
      console.error('API呼び出しに失敗しました');
    } else {
      console.error('予期しないエラー:', error.message);
    }
  }
}
```

## 環境変数

`.env`ファイルに以下を設定してください：

```
ANTHROPIC_API_KEY=your-api-key-here
```

APIキーは https://console.anthropic.com/settings/keys から取得できます。

## トラブルシューティング

### "Missing ANTHROPIC_API_KEY"

環境変数が設定されていません。`.env`ファイルを確認してください。

### "No JSON found in response"

画像からレシピ情報を抽出できませんでした。画像の品質や内容を確認してください。

### API呼び出しエラー

- APIキーが正しいか確認
- インターネット接続を確認
- API使用量の制限を確認
