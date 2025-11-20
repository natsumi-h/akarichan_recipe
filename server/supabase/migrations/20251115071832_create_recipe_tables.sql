-- Recipe Management Database Schema
-- Created: 2025-11-15

-- 1. recipes table - Basic information about recipes
CREATE TABLE IF NOT EXISTS recipes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  steps_text TEXT,
  source_image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);

-- 2. ingredients table - Master table for ingredient names
CREATE TABLE IF NOT EXISTS ingredients (
  id BIGSERIAL PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  group_name TEXT NOT NULL
);

CREATE INDEX idx_ingredients_normalized_name ON ingredients(normalized_name);
CREATE INDEX idx_ingredients_group_name ON ingredients(group_name);

-- 3. recipe_ingredients table - Ingredient lines for recipes
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id BIGSERIAL PRIMARY KEY,
  recipe_id BIGINT NOT NULL,
  ingredient_id BIGINT,
  original_name TEXT NOT NULL,
  amount TEXT,
  note TEXT,
  CONSTRAINT fk_recipe_ingredients_recipe
    FOREIGN KEY (recipe_id)
    REFERENCES recipes(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_recipe_ingredients_ingredient
    FOREIGN KEY (ingredient_id)
    REFERENCES ingredients(id)
    ON DELETE SET NULL
);

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- 4. tags table - Master table for recipe categorization
CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_tags_normalized_name ON tags(normalized_name);
CREATE INDEX idx_tags_sort_order ON tags(sort_order);

-- 5. recipe_tags table - Many-to-many relationship
CREATE TABLE IF NOT EXISTS recipe_tags (
  id BIGSERIAL PRIMARY KEY,
  recipe_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  CONSTRAINT fk_recipe_tags_recipe
    FOREIGN KEY (recipe_id)
    REFERENCES recipes(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_recipe_tags_tag
    FOREIGN KEY (tag_id)
    REFERENCES tags(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_recipe_tags_recipe_tag
    UNIQUE (recipe_id, tag_id)
);

CREATE INDEX idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX idx_recipe_tags_tag_id ON recipe_tags(tag_id);

-- Table comments
COMMENT ON TABLE recipes IS 'Stores basic recipe information';
COMMENT ON TABLE ingredients IS 'Master table for ingredients';
COMMENT ON TABLE recipe_ingredients IS 'Recipe ingredient details';
COMMENT ON TABLE tags IS 'Recipe categorization tags';
COMMENT ON TABLE recipe_tags IS 'Recipe and tag relationships';
