import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

interface SynonymData {
  canonical_name: string;
  synonyms: string[];
}

interface SynonymFile {
  synonyms_array: SynonymData[];
}

async function importSynonyms() {
  console.log("🚀 Starting synonym import process...\n");

  // Get Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  // Use SERVICE_ROLE_KEY for admin operations (bypasses RLS)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env file");
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️  Warning: Using ANON_KEY. For write operations after RLS is enabled, use SUPABASE_SERVICE_ROLE_KEY\n");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read synonym JSON file
  const synonymFilePath = path.join(
    process.cwd(),
    "synonyms",
    "ingredient_synonyms.json"
  );

  if (!fs.existsSync(synonymFilePath)) {
    console.error(`❌ Synonym file not found: ${synonymFilePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(synonymFilePath, "utf-8");
  const synonymFile: SynonymFile = JSON.parse(fileContent);

  console.log(`📄 Found ${synonymFile.synonyms_array.length} ingredient groups\n`);

  let totalSynonymsInserted = 0;
  let totalRelationshipsCreated = 0;
  const errors: string[] = [];

  for (const item of synonymFile.synonyms_array) {
    // {
    //   "canonical_name": "ごはん",
    //   "synonyms": ["ご飯", "米", "白米", "炊いた米"]
    // },
    const { canonical_name, synonyms } = item;

    try {
      console.log(`\n📌 Processing: ${canonical_name}`);

      // Find all ingredients that match canonical_name OR any of the synonyms (partial match)
      // canonical_nameまたはsynonyms配列のいずれかの値と部分一致するingredientsを取得
      const allTerms = [canonical_name, ...synonyms];
      const orConditions = allTerms
        .flatMap(term => [
          `canonical_name.ilike.%${term}%`,
          `normalized_name.ilike.%${term}%`
        ])
        .join(',');

      const { data: matchingIngredients, error: ingredientError } =
        await supabase
          .from("ingredients")
          .select("id, canonical_name")
          .or(orConditions);

      if (ingredientError) {
        throw new Error(
          `Failed to find ingredients: ${ingredientError.message}`
        );
      }

      // もしcanonical_nameまたはsynonyms配列のいずれとも一致するingredientsがない場合でも、synonymsは登録する
      if (!matchingIngredients || matchingIngredients.length === 0) {
        console.log(
          `   ⚠️  No matching ingredients found for "${canonical_name}" or its synonyms`
        );
        console.log(`   ℹ️  Creating synonyms without relationships...`);
      } else {
        console.log(
          `   Found ${matchingIngredients.length} matching ingredient(s)`
        );
      }

      // Insert each synonym
      // synonymsのstring配列をループ
      for (const synonymText of synonyms) {
        // Check if synonym already exists
        // すでにSynonymが存在するかを確認
        const { data: existingSynonym } = await supabase
          .from("synonyms")
          .select("id")
          .eq("synonym", synonymText)
          .single();

        let synonymId: number;

        if (existingSynonym) {
          synonymId = existingSynonym.id;
        } else {
          // Insert new synonym
          // Synonymを追加
          const { data: newSynonym, error: synonymError } = await supabase
            .from("synonyms")
            .insert({ synonym: synonymText })
            .select("id")
            .single();

          if (synonymError) {
            throw new Error(
              `Failed to insert synonym "${synonymText}": ${synonymError.message}`
            );
          }

          synonymId = newSynonym.id;
          totalSynonymsInserted++;
        }

        // Create relationship for each matching ingredient
        // matchingIngredients（canonical_nameまたはsynonyms配列のいずれかと一致するingredients）のそれぞれに対して、synonymとの関係を作成
        // ingredientsが存在する場合のみリレーションを作成
        if (matchingIngredients && matchingIngredients.length > 0) {
          for (const ingredient of matchingIngredients) {
            // Check if relationship already exists
            const { data: existingRelation } = await supabase
              .from("ingredient_synonyms")
              .select("id")
              .eq("ingredient_id", ingredient.id)
              .eq("synonym_id", synonymId)
              .single();

            if (!existingRelation) {
              const { error: relationError } = await supabase
                .from("ingredient_synonyms")
                .insert({
                  ingredient_id: ingredient.id,
                  synonym_id: synonymId,
                });

              if (relationError) {
                throw new Error(
                  `Failed to create relationship: ${relationError.message}`
                );
              }

              totalRelationshipsCreated++;
            }
          }
        }
      }

      console.log(`   ✅ Processed ${synonyms.length} synonyms`);
    } catch (error) {
      const errorMessage = `Failed to process "${canonical_name}": ${error}`;
      console.error(`   ❌ ${errorMessage}`);
      errors.push(errorMessage);
    }
  }

  // Summary
  console.log("\n==================================================");
  console.log("📊 Import Summary");
  console.log("==================================================");
  console.log(`✅ New synonyms inserted: ${totalSynonymsInserted}`);
  console.log(`✅ Relationships created: ${totalRelationshipsCreated}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log("==================================================");

  if (errors.length > 0) {
    console.log("\n❌ Errors encountered:");
    errors.forEach((error) => console.log(`   - ${error}`));
  }
}

// Run the import
importSynonyms().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
