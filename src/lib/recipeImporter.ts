import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';

// Type definitions for JSON input
export interface RecipeIngredient {
  original_name: string;
  normalized_name: string;
  canonical_name: string;
  group_name: string;
  amount: string | null;
  note: string | null;
}

export interface RecipeData {
  title: string;
  description: string | null;
  category: string | null;
  servings?: string | null;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface RecipeJSON {
  recipes: RecipeData[];
}

/**
 * Recipe Importer Class
 * Handles importing recipe data into Supabase database
 */
export class RecipeImporter {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Upsert an ingredient into the database
   * Returns the ingredient ID
   */
  private async upsertIngredient(
    ingredient: RecipeIngredient
  ): Promise<number> {
    // Check if ingredient exists
    const { data: existing, error: selectError } = await this.supabase
      .from('ingredients')
      .select('id')
      .eq('canonical_name', ingredient.canonical_name)
      .eq('normalized_name', ingredient.normalized_name)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Error checking ingredient: ${selectError.message}`);
    }

    if (existing) {
      return existing.id;
    }

    // Insert new ingredient
    const { data: inserted, error: insertError } = await this.supabase
      .from('ingredients')
      .insert({
        canonical_name: ingredient.canonical_name,
        normalized_name: ingredient.normalized_name,
        group_name: ingredient.group_name,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Error inserting ingredient: ${insertError.message}`);
    }

    if (!inserted) {
      throw new Error('Failed to insert ingredient');
    }

    return inserted.id;
  }

  /**
   * Upsert a tag into the database
   * Returns the tag ID
   */
  private async upsertTag(tagName: string): Promise<number> {
    // Normalize tag name (simplified - convert to lowercase)
    const normalizedName = tagName.toLowerCase();

    // Check if tag exists
    const { data: existing, error: selectError } = await this.supabase
      .from('tags')
      .select('id')
      .eq('name', tagName)
      .maybeSingle();

    if (selectError) {
      throw new Error(`Error checking tag: ${selectError.message}`);
    }

    if (existing) {
      return existing.id;
    }

    // Insert new tag
    const { data: inserted, error: insertError } = await this.supabase
      .from('tags')
      .insert({
        name: tagName,
        normalized_name: normalizedName,
        description: null,
        sort_order: 0,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Error inserting tag: ${insertError.message}`);
    }

    if (!inserted) {
      throw new Error('Failed to insert tag');
    }

    return inserted.id;
  }

  /**
   * Import a single recipe into the database
   * @param recipe - Recipe data to import
   * @returns Recipe ID of the imported recipe
   */
  async importRecipe(recipe: RecipeData): Promise<number> {
    // Step 1: Upsert all ingredients and get their IDs
    const ingredientIdMap = new Map<number, number>();

    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ingredient = recipe.ingredients[i];
      const ingredientId = await this.upsertIngredient(ingredient);
      ingredientIdMap.set(i, ingredientId);
    }

    // Step 2: Upsert all tags and get their IDs
    const tagIds: number[] = [];

    for (const tagName of recipe.tags) {
      const tagId = await this.upsertTag(tagName);
      tagIds.push(tagId);
    }

    // Step 3: Insert recipe
    const stepsText = recipe.steps.join('\n');

    const { data: recipeData, error: recipeError } = await this.supabase
      .from('recipes')
      .insert({
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        steps_text: stepsText,
        source_image_url: null,
      })
      .select('id')
      .single();

    if (recipeError) {
      throw new Error(`Error inserting recipe: ${recipeError.message}`);
    }

    if (!recipeData) {
      throw new Error('Failed to insert recipe');
    }

    const recipeId = recipeData.id;

    // Step 4: Insert recipe_ingredients
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ingredient = recipe.ingredients[i];
      const ingredientId = ingredientIdMap.get(i);

      if (!ingredientId) {
        throw new Error(`Missing ingredient ID for index ${i}`);
      }

      const { error: linkError } = await this.supabase
        .from('recipe_ingredients')
        .insert({
          recipe_id: recipeId,
          ingredient_id: ingredientId,
          original_name: ingredient.original_name,
          amount: ingredient.amount,
          note: ingredient.note,
        });

      if (linkError) {
        throw new Error(`Error linking ingredient: ${linkError.message}`);
      }
    }

    // Step 5: Insert recipe_tags
    for (const tagId of tagIds) {
      const { error: tagLinkError } = await this.supabase
        .from('recipe_tags')
        .insert({
          recipe_id: recipeId,
          tag_id: tagId,
        });

      if (tagLinkError) {
        throw new Error(`Error linking tag: ${tagLinkError.message}`);
      }
    }

    return recipeId;
  }

  /**
   * Import multiple recipes from a RecipeJSON object
   * @param recipeJSON - JSON object containing recipes
   * @returns Array of imported recipe IDs
   */
  async importRecipes(recipeJSON: RecipeJSON): Promise<number[]> {
    const importedIds: number[] = [];

    for (const recipe of recipeJSON.recipes) {
      const recipeId = await this.importRecipe(recipe);
      importedIds.push(recipeId);
    }

    return importedIds;
  }

  /**
   * Import multiple recipes with error handling
   * Returns results for each recipe (success or error)
   */
  async importRecipesWithResults(
    recipeJSON: RecipeJSON
  ): Promise<Array<{ success: boolean; recipeTitle: string; recipeId?: number; error?: string }>> {
    const results: Array<{
      success: boolean;
      recipeTitle: string;
      recipeId?: number;
      error?: string;
    }> = [];

    for (const recipe of recipeJSON.recipes) {
      try {
        const recipeId = await this.importRecipe(recipe);
        results.push({
          success: true,
          recipeTitle: recipe.title,
          recipeId,
        });
      } catch (error) {
        results.push({
          success: false,
          recipeTitle: recipe.title,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }
}

/**
 * Create a RecipeImporter instance
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase anon key
 * @returns RecipeImporter instance
 */
export function createRecipeImporter(
  supabaseUrl: string,
  supabaseKey: string
): RecipeImporter {
  return new RecipeImporter(supabaseUrl, supabaseKey);
}
