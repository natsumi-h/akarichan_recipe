import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchForm from './SearchForm';
import RecipeDetail from './RecipeDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>あかりちゃんレシピ検索</h1>
          <p>食材名やタグで、レシピを検索できます</p>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<SearchForm />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Powered by Supabase + Hono + React</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
