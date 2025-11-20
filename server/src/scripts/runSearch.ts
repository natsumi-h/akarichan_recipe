#!/usr/bin/env node
import dotenv from 'dotenv';
import { searchRecipesByQuery } from '../lib/recipeSearch.js';

// Load environment variables
dotenv.config();

/**
 * Main function to run recipe search
 */
async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!supabaseKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable');
  }

  // Get query from command line arguments
  const query = process.argv.slice(2).join(' ');

  if (!query) {
    console.log('Usage: npm run search -- <search query>');
    console.log('Example: npm run search -- 鶏肉 ヘルシー');
    console.log('Example: npm run search -- トマト カレー');
    process.exit(1);
  }

  console.log(`🔍 Searching for: "${query}"\n`);

  try {
    const results = await searchRecipesByQuery(query, supabaseUrl, supabaseKey);

    if (results.length === 0) {
      console.log('No recipes found matching your query.');
      return;
    }

    console.log(`Found ${results.length} recipe(s):\n`);

    for (const recipe of results) {
      console.log('─'.repeat(60));
      console.log(`📖 ${recipe.title}`);
      console.log(`   ID: ${recipe.id}`);

      if (recipe.description) {
        console.log(`   説明: ${recipe.description}`);
      }

      if (recipe.category) {
        console.log(`   カテゴリ: ${recipe.category}`);
      }

      if (recipe.tags.length > 0) {
        console.log(`   タグ: ${recipe.tags.map((t) => t.name).join(', ')}`);
      }

      if (recipe.ingredients.length > 0) {
        console.log(`   材料 (${recipe.ingredients.length}個):`);
        recipe.ingredients.forEach((ing, idx) => {
          const amount = ing.amount || '';
          const canonical = ing.canonical_name
            ? ` (${ing.canonical_name})`
            : '';
          console.log(`     ${idx + 1}. ${ing.original_name}${canonical} ${amount}`);
        });
      }

      console.log('');
    }

    console.log('─'.repeat(60));
    console.log(`\n✅ Search completed. Total: ${results.length} recipe(s)`);
  } catch (error) {
    console.error('❌ Error during search:', error);
    process.exit(1);
  }
}

main();
