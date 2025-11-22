import { readdirSync, writeFileSync, renameSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createRecipeExtractor } from '../lib/recipeExtractor.js';
import type { RecipeJSON } from '../lib/recipeImporter.js';
import { createOpenAIClient, createRecipeText, generateEmbedding } from '../lib/embeddingGenerator.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Convert recipe title to a safe filename
 */
function titleToFilename(title: string): string {
  // Remove special characters and convert to lowercase
  const cleaned = title
    .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAFa-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  // Use romanization for Japanese characters (simplified)
  const romanized = cleaned
    .replace(/[ぁ-ん]/g, 'hiragana')
    .replace(/[ァ-ヴ]/g, 'katakana')
    .replace(/[一-龯]/g, 'kanji');

  // Create a timestamp-based filename if romanization is not helpful
  const timestamp = Date.now();
  return romanized.length > 3 ? romanized.slice(0, 50).toLowerCase() : `recipe_${timestamp}`;
}

/**
 * Main function to extract recipes from screenshots
 */
async function main() {
  console.log('🎨 Starting recipe extraction from screenshots...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }

  // Create extractor instance
  const extractor = createRecipeExtractor(apiKey);

  // Initialize OpenAI client (optional - only if API key is provided)
  let openai: ReturnType<typeof createOpenAIClient> | null = null;
  if (openaiApiKey) {
    openai = createOpenAIClient(openaiApiKey);
    console.log('✅ OpenAI client initialized for embedding generation\n');
  } else {
    console.log('⚠️  OPENAI_API_KEY not found - embeddings will not be generated\n');
  }

  const screenshotsDir = join(__dirname, '../../screenshots');
  const seedDir = join(__dirname, '../../seed');

  try {
    // Get image files (excluding done_ prefix)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const files = readdirSync(screenshotsDir).filter(file => {
      const ext = extname(file).toLowerCase();
      return imageExtensions.includes(ext) && !file.startsWith('done_');
    });

    console.log(`Found ${files.length} image files in screenshots folder (excluding done_ files)\n`);

    if (files.length === 0) {
      console.log('No images to process. Exiting.');
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const imagePath = join(screenshotsDir, file);
      console.log(`\n📸 Processing image: ${file}`);

      try {
        // Extract recipe data from image
        console.log('  Analyzing image with Claude...');
        const recipeJSON: RecipeJSON = await extractor.extractRecipeFromImage(imagePath);

        console.log(`  ✅ Extracted ${recipeJSON.recipes.length} recipe(s) from image`);

        // Generate embeddings for each recipe (if OpenAI client is available)
        if (openai) {
          console.log('  🔢 Generating embeddings...');
          for (let i = 0; i < recipeJSON.recipes.length; i++) {
            const recipe = recipeJSON.recipes[i];
            try {
              const recipeText = createRecipeText(recipe);
              const embedding = await generateEmbedding(openai, recipeText);

              // Add embedding to recipe object
              (recipe as any).embedding = embedding;

              console.log(`     ✅ Generated embedding for: ${recipe.title} (${embedding.length} dimensions)`);

              // Small delay to avoid rate limits
              if (i < recipeJSON.recipes.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
            } catch (embeddingError) {
              console.error(`     ⚠️  Failed to generate embedding for: ${recipe.title}`);
              if (embeddingError instanceof Error) {
                console.error(`        Error: ${embeddingError.message}`);
              }
            }
          }
        }

        // Generate filename based on recipe titles
        let filename: string;
        if (recipeJSON.recipes.length === 1) {
          filename = titleToFilename(recipeJSON.recipes[0].title);
        } else {
          // Multiple recipes - use first recipe title + count
          const firstTitle = titleToFilename(recipeJSON.recipes[0].title);
          filename = `${firstTitle}_and_${recipeJSON.recipes.length - 1}_more`;
        }

        // Ensure unique filename
        let jsonFilename = `${filename}.json`;
        let counter = 1;
        while (readdirSync(seedDir).includes(jsonFilename)) {
          jsonFilename = `${filename}_${counter}.json`;
          counter++;
        }

        // Save JSON file
        const jsonPath = join(seedDir, jsonFilename);
        writeFileSync(jsonPath, JSON.stringify(recipeJSON, null, 2), 'utf-8');
        console.log(`  💾 Saved to: ${jsonFilename}`);

        // List extracted recipes
        for (const recipe of recipeJSON.recipes) {
          console.log(`     - ${recipe.title}`);
        }

        // Rename image file with done_ prefix
        const newImageFilename = `done_${file}`;
        const newImagePath = join(screenshotsDir, newImageFilename);

        try {
          renameSync(imagePath, newImagePath);
          console.log(`  📝 Renamed image to: ${newImageFilename}`);
        } catch (renameError) {
          console.error(`  ⚠️  Failed to rename image: ${renameError instanceof Error ? renameError.message : String(renameError)}`);
        }

        successCount++;
      } catch (error) {
        console.error(`  ❌ Failed to process image: ${file}`);
        if (error instanceof Error) {
          console.error(`     Error: ${error.message}`);
        }
        failureCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Extraction Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${successCount} images`);
    
    console.log(`❌ Failed: ${failureCount} images`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Fatal error during extraction process');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
