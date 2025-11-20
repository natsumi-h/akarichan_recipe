/**
 * Recipe Importer の使用例
 *
 * このファイルは、recipeImporterライブラリの基本的な使い方を示すサンプルコードです。
 */

import { createRecipeImporter, type RecipeJSON } from '../lib/recipeImporter.js';
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

/**
 * 例1: 単一レシピのインポート
 */
async function example1_importSingleRecipe() {
  console.log('=== 例1: 単一レシピのインポート ===\n');

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_ANON_KEY!;

  // インポーター作成
  const importer = createRecipeImporter(supabaseUrl, supabaseKey);

  // レシピデータ
  const recipe = {
    title: "シンプル卵焼き",
    description: "基本の卵焼き",
    category: "副菜",
    tags: ["和風", "卵", "簡単"],
    ingredients: [
      {
        original_name: "卵",
        normalized_name: "たまご",
        canonical_name: "卵",
        group_name: "卵",
        amount: "3個",
        note: null
      },
      {
        original_name: "塩",
        normalized_name: "しお",
        canonical_name: "塩",
        group_name: "調味料",
        amount: "少々",
        note: null
      }
    ],
    steps: [
      "卵を溶く",
      "塩を加える",
      "フライパンで焼く"
    ]
  };

  try {
    const recipeId = await importer.importRecipe(recipe);
    console.log(`✅ レシピをインポートしました (ID: ${recipeId})`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

/**
 * 例2: 複数レシピのインポート
 */
async function example2_importMultipleRecipes() {
  console.log('\n=== 例2: 複数レシピのインポート ===\n');

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_ANON_KEY!;

  const importer = createRecipeImporter(supabaseUrl, supabaseKey);

  // 複数レシピのJSONデータ
  const recipeData: RecipeJSON = {
    recipes: [
      {
        title: "お味噌汁",
        description: "基本のお味噌汁",
        category: "汁物",
        tags: ["和風", "味噌汁"],
        ingredients: [
          {
            original_name: "味噌",
            normalized_name: "みそ",
            canonical_name: "味噌",
            group_name: "調味料",
            amount: "大さじ2",
            note: null
          },
          {
            original_name: "豆腐",
            normalized_name: "とうふ",
            canonical_name: "豆腐",
            group_name: "大豆製品",
            amount: "1/2丁",
            note: null
          }
        ],
        steps: [
          "水を沸かす",
          "豆腐を入れる",
          "味噌を溶く"
        ]
      },
      {
        title: "白米",
        description: "炊きたてご飯",
        category: "米",
        tags: ["和風", "ごはん"],
        ingredients: [
          {
            original_name: "米",
            normalized_name: "こめ",
            canonical_name: "米",
            group_name: "穀類",
            amount: "2合",
            note: null
          },
          {
            original_name: "水",
            normalized_name: "みず",
            canonical_name: "水",
            group_name: "水分",
            amount: "適量",
            note: null
          }
        ],
        steps: [
          "米を研ぐ",
          "水に浸す",
          "炊飯器で炊く"
        ]
      }
    ]
  };

  try {
    const recipeIds = await importer.importRecipes(recipeData);
    console.log(`✅ ${recipeIds.length}件のレシピをインポートしました`);
    console.log(`   レシピID: ${recipeIds.join(', ')}`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

/**
 * 例3: エラーハンドリング付きインポート
 */
async function example3_importWithErrorHandling() {
  console.log('\n=== 例3: エラーハンドリング付きインポート ===\n');

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_ANON_KEY!;

  const importer = createRecipeImporter(supabaseUrl, supabaseKey);

  const recipeData: RecipeJSON = {
    recipes: [
      {
        title: "サラダ",
        description: "フレッシュサラダ",
        category: "副菜",
        tags: ["洋風", "野菜"],
        ingredients: [
          {
            original_name: "レタス",
            normalized_name: "れたす",
            canonical_name: "レタス",
            group_name: "野菜",
            amount: "1/2個",
            note: null
          }
        ],
        steps: ["レタスを洗う", "ちぎる", "ドレッシングをかける"]
      }
    ]
  };

  // 各レシピの成功/失敗を個別に取得
  const results = await importer.importRecipesWithResults(recipeData);

  console.log('インポート結果:');
  for (const result of results) {
    if (result.success) {
      console.log(`  ✅ ${result.recipeTitle} (ID: ${result.recipeId})`);
    } else {
      console.log(`  ❌ ${result.recipeTitle}`);
      console.log(`     エラー: ${result.error}`);
    }
  }
}

/**
 * 例4: JSONオブジェクトを直接インポート
 */
async function example4_importFromObject() {
  console.log('\n=== 例4: JSONオブジェクトを直接インポート ===\n');

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_ANON_KEY!;

  const importer = createRecipeImporter(supabaseUrl, supabaseKey);

  // 外部APIやデータベースから取得したJSONデータを想定
  const externalData: RecipeJSON = {
    recipes: [
      {
        title: "パスタ",
        description: "シンプルなトマトパスタ",
        category: "麺",
        servings: "1人分",
        tags: ["洋風", "パスタ", "トマト"],
        ingredients: [
          {
            original_name: "パスタ",
            normalized_name: "ぱすた",
            canonical_name: "パスタ",
            group_name: "穀類",
            amount: "100g",
            note: null
          },
          {
            original_name: "トマトソース",
            normalized_name: "とまとそーす",
            canonical_name: "トマトソース",
            group_name: "調味料",
            amount: "適量",
            note: null
          }
        ],
        steps: [
          "パスタを茹でる",
          "ソースと絡める"
        ]
      }
    ]
  };

  try {
    const results = await importer.importRecipesWithResults(externalData);

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`成功: ${successCount}件 / 失敗: ${failureCount}件`);
  } catch (error) {
    console.error('予期しないエラー:', error);
  }
}

/**
 * メイン関数（全ての例を実行）
 *
 * 注意: このファイルを実行すると実際にデータベースにデータが登録されます。
 *       テスト実行する場合は、テスト環境で実行してください。
 */
async function main() {
  console.log('🍳 Recipe Importer 使用例\n');
  console.log('注意: このスクリプトは実際にデータベースにデータを登録します。\n');

  // 各例を順番に実行
  // await example1_importSingleRecipe();
  // await example2_importMultipleRecipes();
  // await example3_importWithErrorHandling();
  // await example4_importFromObject();

  console.log('\n✅ 全ての例が完了しました');
  console.log('\n※ 実行する場合は、main()関数内のコメントアウトを外してください。');
}

// 実行（コメントアウトされている）
// main().catch(console.error);

// エクスポート（他のファイルから使用できるように）
export {
  example1_importSingleRecipe,
  example2_importMultipleRecipes,
  example3_importWithErrorHandling,
  example4_importFromObject
};
