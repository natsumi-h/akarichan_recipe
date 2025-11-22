-- Enable pgvector extension for semantic search
-- This migration adds vector column and similarity search functions

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add embedding column to recipes table
-- Using 1536 dimensions for OpenAI text-embedding-3-small
ALTER TABLE recipes
ADD COLUMN embedding vector(1536);

-- Step 3: Create HNSW index for fast similarity search
-- HNSW (Hierarchical Navigable Small World) is faster than IVFFlat for most use cases
CREATE INDEX recipes_embedding_idx ON recipes
USING hnsw (embedding vector_cosine_ops);

-- Step 4: Create RPC function for similarity search
CREATE OR REPLACE FUNCTION match_recipes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  title text,
  description text,
  category text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    recipes.id,
    recipes.title,
    recipes.description,
    recipes.category,
    1 - (recipes.embedding <=> query_embedding) as similarity
  FROM recipes
  WHERE recipes.embedding IS NOT NULL
    AND 1 - (recipes.embedding <=> query_embedding) > match_threshold
  ORDER BY recipes.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Step 5: Create helper function to get similar recipes by recipe ID
CREATE OR REPLACE FUNCTION get_similar_recipes(
  recipe_id bigint,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  title text,
  description text,
  category text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    r.id,
    r.title,
    r.description,
    r.category,
    1 - (r.embedding <=> target.embedding) as similarity
  FROM recipes r
  CROSS JOIN (
    SELECT embedding FROM recipes WHERE id = recipe_id
  ) AS target
  WHERE r.id != recipe_id
    AND r.embedding IS NOT NULL
    AND target.embedding IS NOT NULL
  ORDER BY r.embedding <=> target.embedding
  LIMIT match_count;
$$;

COMMENT ON COLUMN recipes.embedding IS 'Vector embedding for semantic search (OpenAI text-embedding-3-small, 1536 dimensions)';
COMMENT ON FUNCTION match_recipes IS 'Find recipes similar to a given embedding vector';
COMMENT ON FUNCTION get_similar_recipes IS 'Find recipes similar to a given recipe ID';
