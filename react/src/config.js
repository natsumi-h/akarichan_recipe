/**
 * API Configuration
 * Vite環境変数からAPI URLを取得
 */

// Viteの環境変数からAPI URLを取得
// 環境変数が設定されていない場合はローカルホストをフォールバック
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API エンドポイント
export const API_ENDPOINTS = {
  searchRecipes: (query) => `${API_URL}/api/recipes/search?q=${encodeURIComponent(query)}`,
  getAllRecipes: (limit = 100, offset = 0) => `${API_URL}/api/recipes?limit=${limit}&offset=${offset}`,
  getRecipe: (id) => `${API_URL}/api/recipes/${id}`,
  getSimilarRecipes: (id, limit = 5) => `${API_URL}/api/recipes/${id}/similar?limit=${limit}`,
};

// デバッグ用: 開発環境でAPI URLをコンソールに出力
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_URL);
  console.log('🌍 Environment:', import.meta.env.MODE);
}
