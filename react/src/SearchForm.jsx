import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchForm() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(
        `http://localhost:3001/api/recipes/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const data = await response.json();
      setResults(data.data || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setSearched(false);
  };

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipe/${recipeId}`);
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例: 豚コマ、しそ、牛"
            className="search-input"
            disabled={loading}
          />
          <button
            type="submit"
            className="search-button"
            disabled={loading || !query.trim()}
          >
            {loading ? '検索中...' : '検索'}
          </button>
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="clear-button"
              disabled={loading}
            >
              クリア
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="error-message">
          エラー: {error}
        </div>
      )}

      {searched && !loading && !error && (
        <div className="search-results">
          <h2 className="results-header">
            検索結果: {results.length}件
          </h2>

          {results.length === 0 ? (
            <div className="no-results">
              「{query}」に一致するレシピが見つかりませんでした。
            </div>
          ) : (
            <div className="results-grid">
              {results.map((recipe) => (
                <div
                  key={recipe.id}
                  className="recipe-card"
                  onClick={() => handleRecipeClick(recipe.id)}
                >
                  <h3 className="recipe-title">{recipe.title}</h3>

                  {recipe.description && (
                    <p className="recipe-description">{recipe.description}</p>
                  )}

                  {recipe.category && (
                    <div className="recipe-category">
                      カテゴリ: {recipe.category}
                    </div>
                  )}

                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className="recipe-tags">
                      {recipe.tags.map((tag) => (
                        <span key={tag.id} className="tag">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="recipe-ingredients">
                      <h4>材料:</h4>
                      <ul>
                        {recipe.ingredients.slice(0, 5).map((ing, idx) => (
                          <li key={idx}>
                            {ing.canonical_name || ing.original_name}
                            {ing.amount && ` (${ing.amount})`}
                          </li>
                        ))}
                        {recipe.ingredients.length > 5 && (
                          <li>他 {recipe.ingredients.length - 5}件</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchForm;
