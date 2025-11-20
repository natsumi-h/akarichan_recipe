import { searchRecipesByQuery, RecipeSearchResult } from '../lib/recipeSearch.js';

/**
 * API Handler for recipe search
 * This can be used as an API endpoint in frameworks like Express, Next.js, etc.
 */
export async function handleRecipeSearch(
  query: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<{
  success: boolean;
  data?: RecipeSearchResult[];
  error?: string;
  query?: string;
}> {
  try {
    // Validate query
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        error: 'Query parameter is required',
      };
    }

    // Perform search
    const results = await searchRecipesByQuery(query, supabaseUrl, supabaseKey);

    return {
      success: true,
      data: results,
      query: query.trim(),
    };
  } catch (error) {
    console.error('Error in handleRecipeSearch:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      query: query.trim(),
    };
  }
}

/**
 * Express.js compatible middleware example
 *
 * Usage with Express:
 * ```typescript
 * import express from 'express';
 * import { createExpressHandler } from './api/searchRecipes.js';
 *
 * const app = express();
 * const supabaseUrl = process.env.SUPABASE_URL!;
 * const supabaseKey = process.env.SUPABASE_ANON_KEY!;
 *
 * app.get('/api/recipes/search', createExpressHandler(supabaseUrl, supabaseKey));
 * ```
 */
export function createExpressHandler(supabaseUrl: string, supabaseKey: string) {
  return async (req: any, res: any) => {
    const query = req.query.q || req.query.query || '';

    const result = await handleRecipeSearch(query, supabaseUrl, supabaseKey);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  };
}

/**
 * Next.js API route handler example
 *
 * Create a file: pages/api/recipes/search.ts
 * ```typescript
 * import type { NextApiRequest, NextApiResponse } from 'next';
 * import { createNextApiHandler } from '@/lib/api/searchRecipes';
 *
 * const supabaseUrl = process.env.SUPABASE_URL!;
 * const supabaseKey = process.env.SUPABASE_ANON_KEY!;
 *
 * export default createNextApiHandler(supabaseUrl, supabaseKey);
 * ```
 */
export function createNextApiHandler(supabaseUrl: string, supabaseKey: string) {
  return async (req: any, res: any) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const query = req.query.q || req.query.query || '';

    const result = await handleRecipeSearch(query, supabaseUrl, supabaseKey);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  };
}
