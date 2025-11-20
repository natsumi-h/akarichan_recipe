import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.js';
import type { RecipeSearchResult } from './recipeSearch.js';

/**
 * Recipe List Class
 * Handles fetching all recipes or paginated recipes
 */
export class RecipeList {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Fetch all recipes with full details
   * @param limit - Maximum number of recipes to return (default: 100)
   * @param offset - Number of recipes to skip (default: 0)
   * @returns Array of recipes with full details
   */
  async getAllRecipes(
    limit: number = 100,
    offset: number = 0
  ): Promise<RecipeSearchResult[]> {
    // Fetch recipes with pagination
    const { data: recipes, error: recipesError } = await this.supabase
      .from('recipes')
      .select('id, title, description, category, created_at, steps_text')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (recipesError) {
      console.error(`Error fetching recipes: ${recipesError.message}`);
      throw new Error(`Error fetching recipes: ${recipesError.message}`);
    }

    if (!recipes || recipes.length === 0) {
      return [];
    }

    const recipeIds = recipes.map((r) => r.id);

    // Fetch tags for all recipes
    const { data: recipeTags, error: tagsError } = await this.supabase
      .from('recipe_tags')
      .select(
        `
        recipe_id,
        tags(id, name)
      `
      )
      .in('recipe_id', recipeIds);

    if (tagsError) {
      console.error(`Error fetching tags: ${tagsError.message}`);
    }

    // Fetch ingredients for all recipes
    const { data: recipeIngredients, error: ingredientsError } =
      await this.supabase
        .from('recipe_ingredients')
        .select(
          `
        recipe_id,
        ingredient_id,
        original_name,
        amount,
        ingredients(canonical_name)
      `
        )
        .in('recipe_id', recipeIds);

    if (ingredientsError) {
      console.error(`Error fetching ingredients: ${ingredientsError.message}`);
    }

    // Build result array
    const results: RecipeSearchResult[] = recipes.map((recipe) => {
      // Get tags for this recipe
      const tags =
        recipeTags
          ?.filter((rt) => rt.recipe_id === recipe.id)
          .map((rt) => {
            const tag = rt.tags;
            if (tag && typeof tag === 'object' && 'id' in tag && 'name' in tag) {
              return { id: tag.id as number, name: tag.name as string };
            }
            return null;
          })
          .filter((t): t is { id: number; name: string } => t !== null) || [];

      // Get ingredients for this recipe
      const ingredients =
        recipeIngredients
          ?.filter((ri) => ri.recipe_id === recipe.id)
          .map((ri) => {
            const ing = ri.ingredients;
            const canonical_name =
              ing && typeof ing === 'object' && 'canonical_name' in ing
                ? (ing.canonical_name as string)
                : null;

            return {
              id: ri.ingredient_id,
              original_name: ri.original_name,
              canonical_name,
              amount: ri.amount,
            };
          }) || [];

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        category: recipe.category,
        created_at: recipe.created_at || '',
        tags,
        ingredients,
        steps_text: recipe.steps_text || '',
      };
    });

    return results;
  }

  /**
   * Get total count of recipes
   */
  async getRecipeCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Error counting recipes: ${error.message}`);
      throw new Error(`Error counting recipes: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get a single recipe by ID
   * @param id - Recipe ID
   * @returns Recipe with full details or null if not found
   */
  async getRecipeById(id: number): Promise<RecipeSearchResult | null> {
    // Fetch the recipe by ID
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .select('id, title, description, category, created_at, steps_text')
      .eq('id', id)
      .single();

    if (recipeError || !recipe) {
      return null;
    }

    // Fetch tags for this recipe
    const { data: recipeTags } = await this.supabase
      .from('recipe_tags')
      .select(
        `
        recipe_id,
        tags(id, name)
      `
      )
      .eq('recipe_id', id);

    // Fetch ingredients for this recipe
    const { data: recipeIngredients } = await this.supabase
      .from('recipe_ingredients')
      .select(
        `
        recipe_id,
        ingredient_id,
        original_name,
        amount,
        ingredients(canonical_name)
      `
      )
      .eq('recipe_id', id);

    // Build tags array
    const tags =
      recipeTags
        ?.map((rt) => {
          const tag = rt.tags;
          if (tag && typeof tag === 'object' && 'id' in tag && 'name' in tag) {
            return { id: tag.id as number, name: tag.name as string };
          }
          return null;
        })
        .filter((t): t is { id: number; name: string } => t !== null) || [];

    // Build ingredients array
    const ingredients =
      recipeIngredients
        ?.map((ri) => {
          const ing = ri.ingredients;
          const canonical_name =
            ing && typeof ing === 'object' && 'canonical_name' in ing
              ? (ing.canonical_name as string)
              : null;

          return {
            id: ri.ingredient_id,
            original_name: ri.original_name,
            canonical_name,
            amount: ri.amount,
          };
        }) || [];

    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      created_at: recipe.created_at || '',
      tags,
      ingredients,
      steps_text: recipe.steps_text || '',
    };
  }
}

/**
 * Standalone function to get all recipes
 */
export async function getAllRecipes(
  supabaseUrl: string,
  supabaseKey: string,
  limit?: number,
  offset?: number
): Promise<RecipeSearchResult[]> {
  const lister = new RecipeList(supabaseUrl, supabaseKey);
  return lister.getAllRecipes(limit, offset);
}

/**
 * Standalone function to get recipe count
 */
export async function getRecipeCount(
  supabaseUrl: string,
  supabaseKey: string
): Promise<number> {
  const lister = new RecipeList(supabaseUrl, supabaseKey);
  return lister.getRecipeCount();
}

/**
 * Standalone function to get a recipe by ID
 */
export async function getRecipeById(
  supabaseUrl: string,
  supabaseKey: string,
  id: number
): Promise<RecipeSearchResult | null> {
  const lister = new RecipeList(supabaseUrl, supabaseKey);
  return lister.getRecipeById(id);
}
