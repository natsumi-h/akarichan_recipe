# Vercelへのデプロイ手順

## 前提条件

- Vercelアカウントを持っていること
- GitHubリポジトリにプロジェクトをプッシュしていること

## Vercel設定

### 1. プロジェクト設定

Vercelダッシュボードで新しいプロジェクトをインポートする際、以下の設定を行います：

**Framework Preset:** Other

**Root Directory:** `server`

**Build Settings:**
- Build Command: `npm run build` (自動検出されます)
- Output Directory: (空白のまま)
- Install Command: `npm install` (自動検出されます)

※ Vercelは`package.json`の`build`と`start`スクリプトを自動的に検出するため、`vercel.json`は不要です。

### 2. 環境変数の設定

Vercelダッシュボードの「Settings」→「Environment Variables」で以下を設定：

```
SUPABASE_URL=https://uhtvjhcludivyltnlusg.supabase.co
SUPABASE_ANON_KEY=<本番のSupabase Anon Key>
ANTHROPIC_API_KEY=<Anthropic API Key>
FRONTEND_URL=<本番フロントエンドURL (例: https://your-frontend.vercel.app)>
```

※ `FRONTEND_URL`は、CORSで許可するフロントエンドのURLです。デプロイ後に設定してください。

### 3. デプロイ

設定完了後、「Deploy」をクリックすると自動的にビルド・デプロイされます。

## ローカルでビルドテスト

デプロイ前に、ローカルでビルドが成功するか確認できます：

```bash
cd server
npm run build
npm start
```

ビルドが成功すると、`dist/` ディレクトリにコンパイルされたJavaScriptファイルが生成されます。

## デプロイ後の確認

デプロイが完了したら、VercelのURLにアクセスして以下のエンドポイントをテスト：

```
https://your-project.vercel.app/api/recipes/search?q=トマト
```

## トラブルシューティング

### ビルドエラーが発生する場合

1. ローカルで `npm run build` を実行してエラーを確認
2. TypeScriptのエラーを修正
3. 再度Gitにプッシュ

### 環境変数が正しく設定されているか確認

Vercelのログで環境変数が読み込まれているか確認してください。

## 注意事項

- `dist/` ディレクトリは `.gitignore` に含まれているため、Gitにコミットされません
- Vercelが自動的にビルドを実行します
- 環境変数は必ずVercelダッシュボードで設定してください（`.env` ファイルはデプロイされません）
