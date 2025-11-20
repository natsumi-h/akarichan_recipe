-- Add synonym search function
-- Created: 2025-11-16

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
  WITH matched_ingredient_ids AS (
    SELECT DISTINCT isyn.ingredient_id
    FROM ingredient_synonyms isyn
    JOIN synonyms syn ON isyn.synonym_id = syn.id
    WHERE syn.synonym ILIKE '%' || search_query || '%'

    UNION

    SELECT ing.id AS ingredient_id
    FROM ingredients ing
    WHERE ing.canonical_name ILIKE '%' || search_query || '%'
       OR ing.normalized_name ILIKE '%' || search_query || '%'
  )
  SELECT DISTINCT r.id, r.title, r.description, r.category, r.created_at
  FROM recipes r
  JOIN recipe_ingredients ri ON r.id = ri.recipe_id
  WHERE ri.ingredient_id IN (SELECT ingredient_id FROM matched_ingredient_ids)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;
