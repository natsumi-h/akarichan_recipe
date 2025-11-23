-- Enable Row Level Security (RLS) for all tables
-- Security Model: Public read access, authenticated write access
-- Created: 2025-11-23

-- ============================================================================
-- 1. RECIPES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (SELECT)
CREATE POLICY "recipes_public_read" ON recipes
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "recipes_authenticated_insert" ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "recipes_authenticated_update" ON recipes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "recipes_authenticated_delete" ON recipes
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 2. INGREDIENTS TABLE
-- ============================================================================

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ingredients_public_read" ON ingredients
  FOR SELECT
  USING (true);

CREATE POLICY "ingredients_authenticated_insert" ON ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "ingredients_authenticated_update" ON ingredients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "ingredients_authenticated_delete" ON ingredients
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 3. RECIPE_INGREDIENTS TABLE
-- ============================================================================

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_ingredients_public_read" ON recipe_ingredients
  FOR SELECT
  USING (true);

CREATE POLICY "recipe_ingredients_authenticated_insert" ON recipe_ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "recipe_ingredients_authenticated_update" ON recipe_ingredients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "recipe_ingredients_authenticated_delete" ON recipe_ingredients
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 4. TAGS TABLE
-- ============================================================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_public_read" ON tags
  FOR SELECT
  USING (true);

CREATE POLICY "tags_authenticated_insert" ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tags_authenticated_update" ON tags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "tags_authenticated_delete" ON tags
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 5. RECIPE_TAGS TABLE
-- ============================================================================

ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_tags_public_read" ON recipe_tags
  FOR SELECT
  USING (true);

CREATE POLICY "recipe_tags_authenticated_insert" ON recipe_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "recipe_tags_authenticated_update" ON recipe_tags
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "recipe_tags_authenticated_delete" ON recipe_tags
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 6. SYNONYMS TABLE
-- ============================================================================

ALTER TABLE synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "synonyms_public_read" ON synonyms
  FOR SELECT
  USING (true);

CREATE POLICY "synonyms_authenticated_insert" ON synonyms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "synonyms_authenticated_update" ON synonyms
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "synonyms_authenticated_delete" ON synonyms
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- 7. INGREDIENT_SYNONYMS TABLE
-- ============================================================================

ALTER TABLE ingredient_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ingredient_synonyms_public_read" ON ingredient_synonyms
  FOR SELECT
  USING (true);

CREATE POLICY "ingredient_synonyms_authenticated_insert" ON ingredient_synonyms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "ingredient_synonyms_authenticated_update" ON ingredient_synonyms
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "ingredient_synonyms_authenticated_delete" ON ingredient_synonyms
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "recipes_public_read" ON recipes IS
  'Allow anyone to read recipes';
COMMENT ON POLICY "recipes_authenticated_insert" ON recipes IS
  'Allow authenticated users to create recipes';
COMMENT ON POLICY "recipes_authenticated_update" ON recipes IS
  'Allow authenticated users to update recipes';
COMMENT ON POLICY "recipes_authenticated_delete" ON recipes IS
  'Allow authenticated users to delete recipes';
