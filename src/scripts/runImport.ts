import { readFileSync, readdirSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createRecipeImporter, type RecipeJSON } from '../lib/recipeImporter.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main function to import all recipes from seed folder
 */
async function main() {
  console.log('🚀 Starting recipe import process...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables (SUPABASE_URL or SUPABASE_ANON_KEY)');
  }

  // Create importer instance
  const importer = createRecipeImporter(supabaseUrl, supabaseKey);

  const seedDir = join(__dirname, '../../seed');

  try {
    const files = readdirSync(seedDir).filter(file =>
      file.endsWith('.json') && !file.startsWith('done_')
    );

    console.log(`Found ${files.length} JSON files in seed folder (excluding done_ files)\n`);

    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const filePath = join(seedDir, file);
      console.log(`\n📄 Reading file: ${file}`);

      try {
        const fileContent = readFileSync(filePath, 'utf-8');
        const recipeJSON: RecipeJSON = JSON.parse(fileContent);

        console.log(`  Found ${recipeJSON.recipes.length} recipe(s) in file\n`);

        // Import recipes with detailed results
        const results = await importer.importRecipesWithResults(recipeJSON);

        let fileSuccessCount = 0;
        let fileFailureCount = 0;

        for (const result of results) {
          if (result.success) {
            console.log(`  ✅ Successfully imported: ${result.recipeTitle} (ID: ${result.recipeId})`);
            successCount++;
            fileSuccessCount++;
          } else {
            console.log(`  ❌ Failed to import: ${result.recipeTitle}`);
            console.log(`     Error: ${result.error}`);
            failureCount++;
            fileFailureCount++;
          }
        }

        // If all recipes in the file were imported successfully, rename the file
        if (fileFailureCount === 0 && fileSuccessCount > 0) {
          const newFileName = `done_${file}`;
          const newFilePath = join(seedDir, newFileName);

          try {
            renameSync(filePath, newFilePath);
            console.log(`\n  📝 Renamed file to: ${newFileName}`);
          } catch (renameError) {
            console.error(`  ⚠️  Failed to rename file: ${renameError instanceof Error ? renameError.message : String(renameError)}`);
          }
        } else if (fileFailureCount > 0) {
          console.log(`\n  ⚠️  File not renamed due to ${fileFailureCount} failed import(s)`);
        }
      } catch (error) {
        console.error(`❌ Failed to process file: ${file}`);
        if (error instanceof Error) {
          console.error(`   Error: ${error.message}`);
        }
        failureCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Import Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${successCount} recipes`);
    console.log(`❌ Failed: ${failureCount} recipes`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Fatal error during import process');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
