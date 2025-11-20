import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function checkSynonyms() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check for chicken-related synonyms
  console.log('🔍 Checking chicken-related synonyms...\n');

  const { data: synonyms, error } = await supabase
    .from('synonyms')
    .select('*')
    .or('synonym.ilike.%チキン%,synonym.ilike.%ちきん%,synonym.ilike.%鶏%,synonym.ilike.%鳥%,synonym.ilike.%とり%');

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${synonyms?.length || 0} chicken-related synonyms:`);
  synonyms?.forEach((s) => {
    console.log(`  - ${s.synonym} (ID: ${s.id})`);
  });

  // Check ingredient_synonyms relationships
  console.log('\n🔗 Checking ingredient_synonyms relationships...\n');

  const { data: relationships, error: relError } = await supabase
    .from('ingredient_synonyms')
    .select(`
      id,
      ingredient_id,
      ingredients(canonical_name),
      synonyms(synonym)
    `)
    .limit(20);

  if (relError) {
    console.error('❌ Error:', relError.message);
    process.exit(1);
  }

  console.log(`Found ${relationships?.length || 0} relationships (showing first 20):`);
  relationships?.forEach((r: any) => {
    console.log(`  - Ingredient: ${r.ingredients?.canonical_name} ↔ Synonym: ${r.synonyms?.synonym}`);
  });
}

checkSynonyms().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
