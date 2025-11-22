import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import { createOpenAIClient, createRecipeText, generateEmbedding } from '../lib/embeddingGenerator.js';

// Load environment variables
dotenv.config();

/**
 * Main function to generate embeddings for recipes without them
 */
async function main() {
  console.log('🔢 Starting embedding generation for existing recipes...\n');

  const openaiApiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!openaiApiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  // Initialize OpenAI client
  const openai = createOpenAIClient(openaiApiKey);
  console.log('✅ OpenAI client initialized\n');

  // Initialize Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized\n');

  try {
    // Find recipes without embeddings
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, title, description, category')
      .is('embedding', null);

    if (fetchError) {
      throw new Error(`Error fetching recipes: ${fetchError.message}`);
    }

    if (!recipes || recipes.length === 0) {
      console.log('✅ All recipes already have embeddings. Nothing to do.');
      return;
    }

    console.log(`Found ${recipes.length} recipe(s) without embeddings\n`);

    let successCount = 0;
    let failureCount = 0;

    for (const recipe of recipes) {
      console.log(`📝 Processing: ${recipe.title} (ID: ${recipe.id})`);

      try {
        // Generate recipe text
        const recipeText = createRecipeText({
          title: recipe.title,
          description: recipe.description,
          category: recipe.category,
        });

        // Generate embedding
        console.log('  🔢 Generating embedding...');
        const embedding = await generateEmbedding(openai, recipeText);

        // Update recipe with embedding
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ embedding: JSON.stringify(embedding) })
          .eq('id', recipe.id);

        if (updateError) {
          throw new Error(`Error updating recipe: ${updateError.message}`);
        }

        console.log(`  ✅ Generated and saved embedding (${embedding.length} dimensions)\n`);
        successCount++;

        // Small delay to avoid rate limits (100ms between requests)
        if (recipes.indexOf(recipe) < recipes.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`  ❌ Failed to process recipe: ${recipe.title}`);
        if (error instanceof Error) {
          console.error(`     Error: ${error.message}`);
        }
        failureCount++;
        console.log('');
      }
    }

    console.log('='.repeat(50));
    console.log('📊 Embedding Generation Summary');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${successCount} recipes`);
    console.log(`❌ Failed: ${failureCount} recipes`);
    console.log('='.repeat(50) + '\n');

    // Show estimated cost
    const estimatedCost = successCount * 0.00002;
    console.log(`💰 Estimated cost: $${estimatedCost.toFixed(5)}`);
    console.log(`   (Based on ~$0.00002 per recipe with text-embedding-3-small)\n`);

  } catch (error) {
    console.error('❌ Fatal error during embedding generation');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
