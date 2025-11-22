import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';

// Load environment variables
dotenv.config();

/**
 * Test script to verify similar recipe search functionality
 */
async function main() {
  console.log('🔍 Testing similar recipe search functionality...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized\n');

  try {
    // Step 1: Get a sample recipe with embedding
    console.log('📋 Step 1: Fetching a sample recipe with embedding...');
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, title, description, category')
      .not('embedding', 'is', null)
      .limit(1);

    if (fetchError) {
      throw new Error(`Error fetching recipe: ${fetchError.message}`);
    }

    if (!recipes || recipes.length === 0) {
      console.log('❌ No recipes with embeddings found. Please run generate:embeddings first.');
      return;
    }

    const targetRecipe = recipes[0];
    console.log(`✅ Found recipe: "${targetRecipe.title}" (ID: ${targetRecipe.id})`);
    console.log(`   Category: ${targetRecipe.category || 'N/A'}`);
    console.log(`   Description: ${targetRecipe.description || 'N/A'}\n`);

    // Step 2: Call get_similar_recipes function
    console.log('🔍 Step 2: Searching for similar recipes...');
    const { data: similarRecipes, error: searchError } = await supabase
      .rpc('get_similar_recipes', {
        recipe_id: targetRecipe.id,
        match_count: 5,
      });

    if (searchError) {
      throw new Error(`Error searching similar recipes: ${searchError.message}`);
    }

    if (!similarRecipes || similarRecipes.length === 0) {
      console.log('⚠️  No similar recipes found.');
      return;
    }

    console.log(`✅ Found ${similarRecipes.length} similar recipe(s):\n`);
    console.log('='.repeat(70));

    similarRecipes.forEach((recipe: any, index: number) => {
      console.log(`${index + 1}. "${recipe.title}"`);
      console.log(`   ID: ${recipe.id}`);
      console.log(`   Category: ${recipe.category || 'N/A'}`);
      console.log(`   Similarity: ${(recipe.similarity * 100).toFixed(2)}%`);
      console.log(`   Description: ${recipe.description || 'N/A'}`);
      console.log('-'.repeat(70));
    });

    console.log('\n✅ Similar recipe search test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);
