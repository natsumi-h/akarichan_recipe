import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types.js";
import { normalizeSearchQuery } from "./stringUtils.js";

/**
 * Type definition for search result
 */
export type RecipeSearchResult = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
  tags: { id: number; name: string }[];
  ingredients: {
    id: number | null; // ingredient_id (null if not in master)
    original_name: string;
    canonical_name: string | null; // from join
    amount: string | null;
  }[];
  steps_text: string | null;
};

/**
 * Recipe Search Class
 * Handles searching recipes based on query strings
 */
export class RecipeSearch {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Normalize search token (simple normalization)
   * Converts full-width to half-width spaces and trims
   */
  private normalizeQuery(query: string): string[] {
    // Replace full-width spaces with half-width
    const normalized = query.replace(/　/g, " ");

    // Split by spaces and filter out empty strings
    return normalized
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0);
  }

  /**
   * Get recipe IDs that match the token via ingredients
   */
  private async getRecipeIdsByIngredient(token: string): Promise<Set<number>> {
    const recipeIds = new Set<number>();

    // Search in canonical_name and normalized_name using ILIKE
    const { data, error } = await this.supabase
      .from("ingredients")
      .select(
        `
        id,
        recipe_ingredients!inner(recipe_id)
      `
      )
      .or(`canonical_name.ilike.%${token}%,normalized_name.ilike.%${token}%`);

    if (error) {
      console.error(`Error searching ingredients: ${error.message}`);
      return recipeIds;
    }

    if (data) {
      for (const ingredient of data) {
        const recipeIngredients = ingredient.recipe_ingredients;
        if (Array.isArray(recipeIngredients)) {
          for (const ri of recipeIngredients) {
            recipeIds.add(ri.recipe_id);
          }
        }
      }
    }

    return recipeIds;
  }

  /**
   * Get recipe IDs that match the token via tags
   */
  private async getRecipeIdsByTag(token: string): Promise<Set<number>> {
    const recipeIds = new Set<number>();

    // Search in name and normalized_name using ILIKE
    const { data, error } = await this.supabase
      .from("tags")
      .select(
        `
        id,
        recipe_tags!inner(recipe_id)
      `
      )
      .or(`name.ilike.%${token}%,normalized_name.ilike.%${token}%`);

    if (error) {
      console.error(`Error searching tags: ${error.message}`);
      return recipeIds;
    }

    if (data) {
      for (const tag of data) {
        const recipeTags = tag.recipe_tags;
        if (Array.isArray(recipeTags)) {
          for (const rt of recipeTags) {
            recipeIds.add(rt.recipe_id);
          }
        }
      }
    }

    return recipeIds;
  }

  /**
   * Get recipe IDs that match the token in recipe fields
   */
  private async getRecipeIdsByRecipeFields(
    token: string
  ): Promise<Set<number>> {
    const recipeIds = new Set<number>();

    // Search in title, description, and category using ILIKE
    const { data, error } = await this.supabase
      .from("recipes")
      .select("id")
      .or(
        `title.ilike.%${token}%,description.ilike.%${token}%,category.ilike.%${token}%`
      );

    if (error) {
      console.error(`Error searching recipes: ${error.message}`);
      return recipeIds;
    }

    if (data) {
      for (const recipe of data) {
        recipeIds.add(recipe.id);
      }
    }

    return recipeIds;
  }

  /**
   * Get recipe IDs that match a single token
   * Combines results from ingredients, tags, and recipe fields
   */
  private async getRecipeIdsForToken(token: string): Promise<Set<number>> {
    const [ingredientIds, tagIds, recipeIds] = await Promise.all([
      this.getRecipeIdsByIngredient(token),
      this.getRecipeIdsByTag(token),
      this.getRecipeIdsByRecipeFields(token),
    ]);

    // Union of all matching recipe IDs for this token
    const allIds = new Set<number>();
    for (const id of ingredientIds) allIds.add(id);
    for (const id of tagIds) allIds.add(id);
    for (const id of recipeIds) allIds.add(id);

    return allIds;
  }

  /**
   * Calculate intersection of multiple sets
   */
  private intersectSets<T>(sets: Set<T>[]): Set<T> {
    if (sets.length === 0) return new Set();
    if (sets.length === 1) return sets[0];

    const result = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      const currentSet = sets[i];
      for (const item of result) {
        if (!currentSet.has(item)) {
          result.delete(item);
        }
      }
    }

    return result;
  }

  /**
   * Fetch full recipe details for given recipe IDs
   */
  private async fetchRecipeDetails(
    recipeIds: number[]
  ): Promise<RecipeSearchResult[]> {
    if (recipeIds.length === 0) {
      return [];
    }

    // Fetch recipes
    const { data: recipes, error: recipesError } = await this.supabase
      .from("recipes")
      .select("id, title, description, category, created_at, steps_text")
      .in("id", recipeIds)
      .order("created_at", { ascending: false });

    if (recipesError) {
      console.error(`Error fetching recipes: ${recipesError.message}`);
      throw new Error(`Error fetching recipes: ${recipesError.message}`);
    }

    if (!recipes) {
      return [];
    }

    // Fetch tags for each recipe
    const { data: recipeTags, error: tagsError } = await this.supabase
      .from("recipe_tags")
      .select(
        `
        recipe_id,
        tags(id, name)
      `
      )
      .in("recipe_id", recipeIds);

    if (tagsError) {
      console.error(`Error fetching tags: ${tagsError.message}`);
    }

    // Fetch ingredients for each recipe
    const { data: recipeIngredients, error: ingredientsError } =
      await this.supabase
        .from("recipe_ingredients")
        .select(
          `
        recipe_id,
        ingredient_id,
        original_name,
        amount,
        ingredients(canonical_name)
      `
        )
        .in("recipe_id", recipeIds);

    if (ingredientsError) {
      console.error(`Error fetching ingredients: ${ingredientsError.message}`);
    }

    // Build result map
    const results: RecipeSearchResult[] = recipes.map((recipe) => {
      // Get tags for this recipe
      const tags =
        recipeTags
          ?.filter((rt) => rt.recipe_id === recipe.id)
          .map((rt) => {
            const tag = rt.tags;
            if (
              tag &&
              typeof tag === "object" &&
              "id" in tag &&
              "name" in tag
            ) {
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
              ing && typeof ing === "object" && "canonical_name" in ing
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
        created_at: recipe.created_at || "",
        tags,
        ingredients,
        steps_text: recipe.steps_text || "",
      };
    });

    return results;
  }

  /**
   * Search recipes using synonym support (new implementation)
   * Uses PostgreSQL function with two-stage search:
   * 1. Search in synonyms table
   * 2. Fallback to direct ingredient search
   *
   * Supports AND search: space-separated tokens are treated as AND conditions
   * Example: "鶏肉 ヘルシー" searches for recipes that match BOTH "鶏肉" AND "ヘルシー"
   *
   * @param query - Search query string (space-separated for AND search)
   * @returns Array of matching recipes with full details
   */
  async searchRecipesWithSynonyms(
    query: string
  ): Promise<RecipeSearchResult[]> {
    // Split query into tokens (space-separated)
    const tokens = this.normalizeQuery(query);

    if (tokens.length === 0) {
      return [];
    }

    // Search for each token and collect recipe IDs
    const tokenResultSets: Set<number>[] = [];

    for (const token of tokens) {
      // Normalize token (katakana to hiragana)
      const normalizedToken = normalizeSearchQuery(token);

      // Search with both original and normalized token
      const [originalResults, normalizedResults] = await Promise.all([
        this.supabase.rpc("search_recipes_with_synonyms", {
          search_query: token,
        }),
        normalizedToken !== token
          ? this.supabase.rpc("search_recipes_with_synonyms", {
              search_query: normalizedToken,
            })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (originalResults.error) {
        console.error(
          `Error searching with token "${token}": ${originalResults.error.message}`
        );
        // If one token fails, return empty results (AND logic requires all tokens)
        return [];
      }

      // Combine results from original and normalized token
      const tokenResults = [
        ...(originalResults.data || []),
        ...(normalizedResults.data || []),
      ];

      // Extract recipe IDs for this token
      const recipeIds = new Set(tokenResults.map((r: any) => r.id as number));
      tokenResultSets.push(recipeIds);
    }

    // Calculate intersection of all token results (AND logic)
    const intersectedIds = this.intersectSets(tokenResultSets);

    if (intersectedIds.size === 0) {
      return [];
    }

    // Fetch full details with tags and ingredients
    const uniqueRecipeIds = Array.from(intersectedIds);
    const results = await this.fetchRecipeDetails(uniqueRecipeIds);

    return results;
  }

  /**
   * Search recipes by query string (legacy method)
   * @param query - Search query string (space-separated tokens)
   * @returns Array of matching recipes with full details
   */
  async searchRecipesByQuery(query: string): Promise<RecipeSearchResult[]> {
    // Use new synonym search by default
    return this.searchRecipesWithSynonyms(query);
  }
}

/**
 * Create a RecipeSearch instance
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase anon key or service role key
 * @returns RecipeSearch instance
 */
export function createRecipeSearch(
  supabaseUrl: string,
  supabaseKey: string
): RecipeSearch {
  return new RecipeSearch(supabaseUrl, supabaseKey);
}

/**
 * Standalone function to search recipes
 * @param query - Search query string
 * @param supabaseUrl - Supabase project URL
 * @param supabaseKey - Supabase anon key or service role key
 * @returns Array of matching recipes
 */
export async function searchRecipesByQuery(
  query: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<RecipeSearchResult[]> {
  const searcher = createRecipeSearch(supabaseUrl, supabaseKey);
  return searcher.searchRecipesByQuery(query);
}
