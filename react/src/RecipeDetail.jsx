import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./config";

function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecipeDetail();
  }, [id]);

  const fetchRecipeDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.getRecipe(id));

      if (!response.ok) {
        throw new Error("レシピの取得に失敗しました");
      }

      const data = await response.json();
      setRecipe(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  console.log(recipe);

  if (loading) {
    return (
      <div className="recipe-detail-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-detail-container">
        <div className="error-message">エラー: {error}</div>
        <button onClick={handleBack} className="back-button">
          検索に戻る
        </button>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="recipe-detail-container">
        <div className="error-message">レシピが見つかりませんでした</div>
        <button onClick={handleBack} className="back-button">
          検索に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="recipe-detail-container">
      <button onClick={handleBack} className="back-button">
        ← 検索に戻る
      </button>

      <div className="recipe-detail-card">
        <h1 className="recipe-detail-title">{recipe.title}</h1>

        {recipe.category && (
          <div className="recipe-detail-category">
            カテゴリ: {recipe.category}
          </div>
        )}

        {recipe.description && (
          <div className="recipe-detail-description">
            <h2>説明</h2>
            <p>{recipe.description}</p>
          </div>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-detail-tags">
            <h3>タグ</h3>
            <div className="recipe-tags">
              {recipe.tags.map((tag) => (
                <span key={tag.id} className="tag">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="recipe-detail-ingredients">
            <h2>材料</h2>
            <ul className="ingredients-list">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="ingredient-item">
                  <span className="ingredient-name">
                    {ing.canonical_name || ing.original_name}
                  </span>
                  {ing.amount && (
                    <span className="ingredient-amount">
                      ... {ing.amount}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipe.steps_text && (
          <div className="recipe-detail-steps">
            <h2>作り方</h2>
            <div className="steps-list">
              {recipe.steps_text.split('。').filter(step => step.trim()).map((step, idx) => (
                <div key={idx} className="step-item">
                  <div className="step-number">{idx + 1}.</div>
                  <div className="step-content">{step.trim()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeDetail;
