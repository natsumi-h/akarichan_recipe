-- Synonym Tables Migration
-- Created: 2025-11-16
-- Purpose: Add synonym support for ingredient search

-- 1. synonyms table - Master table for synonym strings
CREATE TABLE IF NOT EXISTS synonyms (
  id BIGSERIAL PRIMARY KEY,
  synonym TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_synonyms_synonym ON synonyms(synonym);

COMMENT ON TABLE synonyms IS 'Synonym master table for ingredients';

-- 2. ingredient_synonyms table - Many-to-many relationship between ingredients and synonyms
CREATE TABLE IF NOT EXISTS ingredient_synonyms (
  id BIGSERIAL PRIMARY KEY,
  ingredient_id BIGINT NOT NULL,
  synonym_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_ingredient_synonyms_ingredient
    FOREIGN KEY (ingredient_id)
    REFERENCES ingredients(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_ingredient_synonyms_synonym
    FOREIGN KEY (synonym_id)
    REFERENCES synonyms(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_ingredient_synonyms_pair
    UNIQUE (ingredient_id, synonym_id)
);

CREATE INDEX idx_ingredient_synonyms_ingredient_id
  ON ingredient_synonyms(ingredient_id);

CREATE INDEX idx_ingredient_synonyms_synonym_id
  ON ingredient_synonyms(synonym_id);

COMMENT ON TABLE ingredient_synonyms IS 'Many-to-many relationship between ingredients and synonyms';
COMMENT ON COLUMN ingredient_synonyms.ingredient_id IS 'Reference to ingredients table';
COMMENT ON COLUMN ingredient_synonyms.synonym_id IS 'Reference to synonyms table';
