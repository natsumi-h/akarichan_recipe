import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import { searchRecipesByQuery } from '../lib/recipeSearch.js';
import { getAllRecipes, getRecipeCount } from '../lib/recipeList.js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials not configured');
}

// Create Hono app
const app = new Hono();

// CORS configuration
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Recipe API Server',
    version: '1.0.0',
    endpoints: {
      health: 'GET /',
      list: 'GET /api/recipes',
      search: 'GET /api/recipes/search?q=<query>',
      detail: 'GET /api/recipes/:id',
    },
  });
});

// All recipes endpoint with pagination
app.get('/api/recipes', async (c) => {
  try {
    // Get pagination parameters
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    // Validate parameters
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return c.json(
        {
          success: false,
          error: 'Invalid limit parameter',
          message: 'Limit must be between 1 and 1000',
        },
        400
      );
    }

    if (isNaN(offset) || offset < 0) {
      return c.json(
        {
          success: false,
          error: 'Invalid offset parameter',
          message: 'Offset must be 0 or greater',
        },
        400
      );
    }

    // Fetch recipes and total count in parallel
    const [recipes, totalCount] = await Promise.all([
      getAllRecipes(supabaseUrl, supabaseKey, limit, offset),
      getRecipeCount(supabaseUrl, supabaseKey),
    ]);

    // Return results with pagination info
    return c.json({
      success: true,
      total: totalCount,
      count: recipes.length,
      limit,
      offset,
      hasMore: offset + recipes.length < totalCount,
      data: recipes,
    });
  } catch (error) {
    console.error('Error in all recipes endpoint:', error);
    return c.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      500
    );
  }
});

// Recipe search endpoint
app.get('/api/recipes/search', async (c) => {
  try {
    // Get query parameter
    const query = c.req.query('q') || c.req.query('query') || '';

    // Validate query
    if (!query || query.trim().length === 0) {
      return c.json(
        {
          success: false,
          error: 'Query parameter is required',
          message: 'Please provide a search query using ?q=<search_term>',
        },
        400
      );
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return c.json(
        {
          success: false,
          error: 'Server configuration error',
          message: 'Supabase credentials not configured',
        },
        500
      );
    }

    // Perform search
    const results = await searchRecipesByQuery(query, supabaseUrl, supabaseKey);

    // Return results
    return c.json({
      success: true,
      query: query.trim(),
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);

    return c.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      500
    );
  }
});

// Recipe detail endpoint (bonus)
app.get('/api/recipes/:id', async (c) => {
  try {
    
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          error: 'Invalid recipe ID',
        },
        400
      );
    }

    // // Get Supabase credentials
    // const supabaseUrl = process.env.SUPABASE_URL;
    // const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return c.json(
        {
          success: false,
          error: 'Server configuration error',
        },
        500
      );
    }

    // Search by ID (using the search function with empty query and filtering)
    const results = await searchRecipesByQuery('', supabaseUrl, supabaseKey);
    const recipe = results.find((r) => r.id === id);

    if (!recipe) {
      return c.json(
        {
          success: false,
          error: 'Recipe not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error('Error in recipe detail endpoint:', error);

    return c.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      500
    );
  }
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not found',
      message: 'The requested endpoint does not exist',
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      success: false,
      error: 'Internal server error',
      message: err.message,
    },
    500
  );
});

// Start server
const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Starting Recipe API Server...`);
console.log(`📍 Server running on http://localhost:${port}`);
console.log(`\n📚 Available endpoints:`);
console.log(`   GET  /                                 - Health check`);
console.log(`   GET  /api/recipes                      - Get all recipes (supports pagination)`);
console.log(`   GET  /api/recipes/search?q=...         - Search recipes`);
console.log(`   GET  /api/recipes/:id                  - Get recipe by ID`);
console.log(`\n💡 Examples:`);
console.log(`   curl "http://localhost:${port}/api/recipes"`);
console.log(`   curl "http://localhost:${port}/api/recipes?limit=10&offset=0"`);
console.log(`   curl "http://localhost:${port}/api/recipes/search?q=鶏肉"`);
console.log(`\n🛑 Press Ctrl+C to stop the server\n`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
