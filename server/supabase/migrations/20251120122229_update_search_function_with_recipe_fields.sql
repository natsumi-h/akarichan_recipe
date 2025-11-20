-- Update synonym search function to include recipe fields and tags
-- Created: 2025-11-20

CREATE OR REPLACE FUNCTION search_recipes_with_synonyms(search_query TEXT)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH matched_recipe_ids AS (
    -- 1. Search via synonyms
    SELECT DISTINCT ri.recipe_id
    FROM ingredient_synonyms isyn
    JOIN synonyms syn ON isyn.synonym_id = syn.id
    JOIN recipe_ingredients ri ON isyn.ingredient_id = ri.ingredient_id
    WHERE syn.synonym ILIKE '%' || search_query || '%'

    UNION

    -- 2. Search directly in ingredients
    SELECT DISTINCT ri.recipe_id
    FROM ingredients ing
    JOIN recipe_ingredients ri ON ing.id = ri.ingredient_id
    WHERE ing.canonical_name ILIKE '%' || search_query || '%'
       OR ing.normalized_name ILIKE '%' || search_query || '%'

    UNION

    -- 3. Search in recipe title, description, category
    SELECT r.id AS recipe_id
    FROM recipes r
    WHERE r.title ILIKE '%' || search_query || '%'
       OR r.description ILIKE '%' || search_query || '%'
       OR r.category ILIKE '%' || search_query || '%'

    UNION

    -- 4. Search in tags
    SELECT DISTINCT rt.recipe_id
    FROM tags t
    JOIN recipe_tags rt ON t.id = rt.tag_id
    WHERE t.name ILIKE '%' || search_query || '%'
       OR t.normalized_name ILIKE '%' || search_query || '%'
  )
  SELECT DISTINCT r.id, r.title, r.description, r.category, r.created_at
  FROM recipes r
  WHERE r.id IN (SELECT recipe_id FROM matched_recipe_ids)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
