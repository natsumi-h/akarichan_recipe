import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import type { RecipeJSON } from './recipeImporter.js';

/**
 * Recipe Extractor Class
 * Extracts recipe data from images using Anthropic's Claude API
 */
export class RecipeExtractor {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Convert image file to base64
   */
  private imageToBase64(imagePath: string): string {
    const imageBuffer = readFileSync(imagePath);
    return imageBuffer.toString('base64');
  }

  /**
   * Get media type from file extension
   */
  private getMediaType(imagePath: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    const ext = imagePath.toLowerCase().split('.').pop();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg'; // default fallback
    }
  }

  /**
   * Extract recipe data from an image
   * @param imagePath - Path to the image file
   * @returns RecipeJSON object extracted from the image
   */
  async extractRecipeFromImage(imagePath: string): Promise<RecipeJSON> {
    const base64Image = this.imageToBase64(imagePath);
    const mediaType = this.getMediaType(imagePath);

    const systemPrompt = `あなたは、日本語のレシピ本をもとにしたレシピ管理アプリのための「レシピ構造化アシスタント」です。
画像に含まれるレシピ情報を読み取り、DB に保存しやすい JSON に変換してください。

## 前提

- レシピ画像には、以下の情報が含まれていることが多いです：
  - レシピタイトル
  - 材料（1 行ずつ）
  - 作り方（手順）
  - 説明文（リード文）
- 1 枚の画像に複数レシピが載っていることもあります（例：上段と下段で別レシピ）。

## 出力するJSON構造

\`\`\`json
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
\`\`\`

## フィールドルール

### title
- レシピのタイトルをそのまま入れてください。

### description
- 写真横やタイトル近くにあるリード文（紹介文）を入れてください。
- なければ null。

### category
- レシピ全体のカテゴリをざっくり推定してください。例：主菜、副菜、汁物、米、麺、サラダ、デザート
- 不明な場合は null。

### servings
- 「2 人分」「1 人分」など、人数表記があればそのまま入れてください。
- なければ null。

### tags
- レシピを特徴づけるタグを 3〜7 個程度 日本語で付与してください。
- 例：和風、洋風、中華、エスニック、牛肉、豚肉、鶏肉、野菜たっぷり、ヘルシー、さっぱり、こってり、甘辛、主菜、副菜、丼、スープ、パスタ、春、夏、秋、冬

### ingredients
材料は 1 行につき 1 オブジェクト。

- **original_name**: レシピの材料欄に書かれている名前をそのまま
- **normalized_name**: ひらがなに変換（検索用）。例：「牛こま切れ肉」→「ぎゅうこまぎれにく」
- **canonical_name**: 一般名称。例：「牛こま切れ肉」→「牛肉」
- **group_name**: 食材の大分類。例：肉、魚、卵、野菜、調味料、油脂、水分、穀類、乳製品、薬味
- **amount**: 分量（例：「180g」「1/2 枚」「小さじ 1」）
- **note**: 「A」「B」「★」「下味用」などの補助情報

### steps
- レシピの「作り方」を 1 手順 1 要素 で配列に。
- 手順番号は保持しても削除しても構いません。

## 重要ルール

- **必ず JSON のみ** を返してください。説明文は不要です。
- 最上位は {"recipes": [...]} のオブジェクトであること。
- JSON にコメント（// や /* */）を含めないこと。
- 画像に複数レシピがある場合は、recipes 配列に複数の要素を追加してください。
- 画像に書かれていない材料や手順を創作しないでください。`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: '画像からレシピ情報を抽出してJSON形式で出力してください。',
            },
          ],
        },
      ],
      system: systemPrompt,
    });

    // Extract JSON from response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n');

    // Try to parse JSON from response
    // Look for JSON object in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const recipeJSON: RecipeJSON = JSON.parse(jsonMatch[0]);
    return recipeJSON;
  }
}

/**
 * Create a RecipeExtractor instance
 * @param apiKey - Anthropic API key
 * @returns RecipeExtractor instance
 */
export function createRecipeExtractor(apiKey: string): RecipeExtractor {
  return new RecipeExtractor(apiKey);
}
