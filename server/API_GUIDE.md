# Recipe API Guide

HonoベースのレシピAPIサーバーの使い方

## 🚀 起動方法

### 開発モード（ファイル変更を自動検知）

```bash
npm run dev
```

### 本番モード

```bash
npm run serve
```

デフォルトではポート3000で起動します。別のポートを使用する場合は環境変数 `PORT` を設定してください：

```bash
PORT=8080 npm run serve
```

## 📡 エンドポイント一覧

### 1. ヘルスチェック

APIの状態を確認します。

**エンドポイント:** `GET /`

**レスポンス例:**
```json
{
  "status": "ok",
  "message": "Recipe API Server",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /",
    "list": "GET /api/recipes",
    "search": "GET /api/recipes/search?q=<query>",
    "detail": "GET /api/recipes/:id"
  }
}
```

**curlコマンド:**
```bash
curl "http://localhost:3000/"
```

---

### 2. 全件レシピ取得

すべてのレシピを取得します。ページネーションに対応しています。

**エンドポイント:** `GET /api/recipes`

**クエリパラメータ:**
- `limit` (オプション): 1回で取得する件数（1-1000、デフォルト: 100）
- `offset` (オプション): スキップする件数（デフォルト: 0）

**レスポンス例:**
```json
{
  "success": true,
  "total": 9,
  "count": 3,
  "limit": 3,
  "offset": 0,
  "hasMore": true,
  "data": [
    {
      "id": 1,
      "title": "スペアリブのジャスミン茶煮込み",
      "description": "...",
      "category": "主菜",
      "created_at": "2025-11-15T09:54:16.657531+00:00",
      "tags": [...],
      "ingredients": [...]
    }
  ]
}
```

**レスポンスフィールド:**
- `success`: リクエストの成否
- `total`: データベース内の全レシピ数
- `count`: 今回返されたレシピ数
- `limit`: リクエストされた件数
- `offset`: スキップされた件数
- `hasMore`: まだ取得していないレシピがあるか
- `data`: レシピの配列

**curlコマンド例:**

```bash
# すべて取得（デフォルト: 100件まで）
curl "http://localhost:3000/api/recipes"

# 最初の10件を取得
curl "http://localhost:3000/api/recipes?limit=10&offset=0"

# 次の10件を取得
curl "http://localhost:3000/api/recipes?limit=10&offset=10"

# ページネーションの例（1ページ5件）
# 1ページ目
curl "http://localhost:3000/api/recipes?limit=5&offset=0"
# 2ページ目
curl "http://localhost:3000/api/recipes?limit=5&offset=5"
# 3ページ目
curl "http://localhost:3000/api/recipes?limit=5&offset=10"
```

**エラーレスポンス例:**

limitが範囲外の場合：
```json
{
  "success": false,
  "error": "Invalid limit parameter",
  "message": "Limit must be between 1 and 1000"
}
```

---

### 3. レシピ検索

キーワードでレシピを検索します。複数キーワードを指定すると、すべてにマッチするレシピのみを返します（AND検索）。

**エンドポイント:** `GET /api/recipes/search`

**クエリパラメータ:**
- `q` または `query` (必須): 検索キーワード（スペース区切りで複数指定可）

**レスポンス例:**
```json
{
  "success": true,
  "query": "鶏肉",
  "count": 1,
  "data": [
    {
      "id": 4,
      "title": "鶏もも肉の赤ワイン煮込み",
      "description": "赤ワインでじっくり煮込んだ...",
      "category": "主菜",
      "created_at": "2025-11-15T09:54:16.657531+00:00",
      "tags": [
        { "id": 8, "name": "洋風" },
        { "id": 17, "name": "鶏肉" }
      ],
      "ingredients": [
        {
          "id": 24,
          "original_name": "鶏もも肉",
          "canonical_name": "鶏もも肉",
          "amount": "1枚"
        }
      ]
    }
  ]
}
```

**curlコマンド例:**

```bash
# 単一キーワード
curl "http://localhost:3000/api/recipes/search?q=鶏肉"

# 複数キーワード（AND検索）
curl "http://localhost:3000/api/recipes/search?q=鶏肉%20ヘルシー"

# タグで検索
curl "http://localhost:3000/api/recipes/search?q=和風"

# カテゴリと材料で検索
curl "http://localhost:3000/api/recipes/search?q=主菜%20牛肉"
```

**エラーレスポンス例:**

クエリパラメータがない場合：
```json
{
  "success": false,
  "error": "Query parameter is required",
  "message": "Please provide a search query using ?q=<search_term>"
}
```

---

### 4. レシピ詳細取得

IDを指定してレシピの詳細を取得します。

**エンドポイント:** `GET /api/recipes/:id`

**パスパラメータ:**
- `id` (必須): レシピID（数値）

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "title": "鶏もも肉の赤ワイン煮込み",
    "description": "赤ワインでじっくり煮込んだ...",
    "category": "主菜",
    "created_at": "2025-11-15T09:54:16.657531+00:00",
    "tags": [...],
    "ingredients": [...]
  }
}
```

**curlコマンド例:**
```bash
curl "http://localhost:3000/api/recipes/4"
```

**エラーレスポンス例:**

レシピが見つからない場合：
```json
{
  "success": false,
  "error": "Recipe not found"
}
```

---

## 🌐 CORS設定

デフォルトでは、すべてのオリジンからのリクエストを許可しています。

本番環境では、`src/server/index.ts` の以下の部分を変更してください：

```typescript
app.use('/*', cors({
  origin: 'https://your-domain.com', // 許可するオリジンを指定
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 🔒 HTTPS対応

### 開発環境でHTTPSを使用する

HTTPSで動作させる場合は、SSL証明書を用意し、サーバーコードを以下のように変更します：

1. **SSL証明書を生成（開発用）:**

```bash
# opensslで自己署名証明書を生成
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

2. **サーバーコードを変更:**

`src/server/index.ts` の最後の部分を変更：

```typescript
import { createServer } from 'https';
import { readFileSync } from 'fs';

const port = parseInt(process.env.PORT || '3000');

const server = createServer(
  {
    key: readFileSync('./key.pem'),
    cert: readFileSync('./cert.pem'),
  },
  app.fetch
);

server.listen(port, () => {
  console.log(`🚀 HTTPS Server running on https://localhost:${port}`);
});
```

### 本番環境

本番環境では、以下の方法でHTTPSを実現できます：

1. **リバースプロキシ（推奨）:**
   - Nginx、Caddy、Cloudflare などでSSL終端
   - アプリケーション自体はHTTPで動作

2. **クラウドサービス:**
   - Vercel、Cloudflare Workers、AWS Lambda + API Gateway など
   - これらはHTTPSを自動的に提供

3. **Let's Encrypt:**
   - 無料のSSL証明書を使用
   - Certbotなどのツールで自動更新

---

## 🔧 環境変数

`.env` ファイルに以下の環境変数を設定してください：

```bash
# Supabase設定
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-anon-key

# サーバー設定（オプション）
PORT=3000
```

---

## 📦 デプロイ例

### Vercelにデプロイ

1. `vercel.json` を作成：

```json
{
  "buildCommand": "npm install",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/src/server/index.ts"
    }
  ]
}
```

2. デプロイ：

```bash
npm install -g vercel
vercel
```

### Cloudflare Workersにデプロイ

Honoは Cloudflare Workers にも対応しています。

1. `wrangler.toml` を作成
2. サーバーコードを Workers用に調整
3. `wrangler publish` でデプロイ

詳細は [Hono公式ドキュメント](https://hono.dev/) を参照してください。

---

## 🧪 APIテスト

### curlでのテスト

```bash
# ヘルスチェック
curl http://localhost:3000/

# 全件取得
curl http://localhost:3000/api/recipes

# ページネーション（最初の5件）
curl "http://localhost:3000/api/recipes?limit=5&offset=0"

# 検索（単一キーワード）
curl "http://localhost:3000/api/recipes/search?q=鶏肉"

# 検索（複数キーワード）
curl "http://localhost:3000/api/recipes/search?q=主菜%20牛肉"

# レシピ詳細
curl http://localhost:3000/api/recipes/4
```

### JavaScriptでのテスト

```javascript
// 全件取得
async function getAllRecipes(limit = 10, offset = 0) {
  const response = await fetch(
    `http://localhost:3000/api/recipes?limit=${limit}&offset=${offset}`
  );
  const data = await response.json();
  console.log(`Total: ${data.total}, Fetched: ${data.count}, Has more: ${data.hasMore}`);
  return data;
}

// レシピ検索
async function searchRecipes(query) {
  const response = await fetch(
    `http://localhost:3000/api/recipes/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  console.log(data);
  return data;
}

// 使用例
getAllRecipes(5, 0); // 最初の5件
searchRecipes('鶏肉 ヘルシー');
```

### Postmanでのテスト

1. Postmanを開く
2. GETリクエストを作成
3. URL: `http://localhost:3000/api/recipes/search?q=鶏肉`
4. Send をクリック

---

## 🐛 トラブルシューティング

### サーバーが起動しない

**問題:** ポートが既に使用されている

**解決策:**
```bash
# 別のポートで起動
PORT=8080 npm run serve
```

### CORS エラー

**問題:** ブラウザからAPIにアクセスできない

**解決策:** `src/server/index.ts` のCORS設定を確認

### 検索結果が空

**問題:** Supabaseに接続できていない

**解決策:**
1. Supabaseが起動しているか確認: `npm run supabase:status`
2. `.env` ファイルの設定を確認
3. データが登録されているか確認: `npm run search -- 鶏肉`

---

## 📚 参考リンク

- [Hono公式ドキュメント](https://hono.dev/)
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [検索APIの詳細](src/api/README.md)

---

## 🎉 使用例

### フロントエンドから使用（React）

```jsx
import { useState, useEffect } from 'react';

function RecipeList() {
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  // 全件取得（ページネーション）
  const fetchRecipes = async (pageNum) => {
    setLoading(true);
    const offset = pageNum * limit;
    const response = await fetch(
      `http://localhost:3000/api/recipes?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    if (data.success) {
      setRecipes(data.data);
      setTotal(data.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecipes(page);
  }, [page]);

  return (
    <div>
      <h2>レシピ一覧 ({total}件)</h2>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <>
          <div>
            {recipes.map((recipe) => (
              <div key={recipe.id}>
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
                <p>カテゴリ: {recipe.category}</p>
                <p>タグ: {recipe.tags.map(t => t.name).join(', ')}</p>
              </div>
            ))}
          </div>

          <div>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              前のページ
            </button>
            <span>ページ {page + 1} / {Math.ceil(total / limit)}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * limit >= total}
            >
              次のページ
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RecipeSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const response = await fetch(
      `http://localhost:3000/api/recipes/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    if (data.success) {
      setResults(data.data);
    }
  };

  return (
    <div>
      <h2>レシピ検索</h2>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="レシピを検索..."
      />
      <button onClick={handleSearch}>検索</button>

      <div>
        {results.map((recipe) => (
          <div key={recipe.id}>
            <h3>{recipe.title}</h3>
            <p>{recipe.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ライセンス

MIT
