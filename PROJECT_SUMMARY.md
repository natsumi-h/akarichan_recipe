# あかりちゃんレシピ検索

Supabase + Hono + React で構築されたレシピ検索アプリケーション

## プロジェクト構成

```
akarichan_recipe/
├── server/          # バックエンド（Hono + Supabase）
│   ├── src/         # ソースコード
│   ├── supabase/    # Supabase設定・マイグレーション
│   ├── seed/        # レシピデータ
│   ├── synonyms/    # シノニムデータ
│   └── .env         # 環境変数（gitignore対象）
│
└── react/           # フロントエンド（React + Vite）
    ├── src/         # ソースコード
    └── .env         # 環境変数（gitignore対象）
```

## セットアップ

### 1. サーバー側の環境変数

詳細は `server/.env.example` を参照してください。

```bash
cd server
cp .env.example .env
# .env を編集してSupabase認証情報を設定
```

### 2. React側の環境変数

詳細は `react/.env.example` を参照してください。

```bash
cd react
cp .env.example .env.local
# .env.local を編集してAPI URLを設定
```

## 開発

### サーバー起動

```bash
cd server
npm install
npm run supabase:start  # ローカルSupabaseを起動
npm run dev             # APIサーバーを起動
```

### Reactアプリ起動

```bash
cd react
npm install
npm run dev
```

## デプロイ

各プロジェクトの環境変数ファイルを本番用に設定してからデプロイしてください。

- サーバー: `server/.env.production`
- React: `react/.env.production`
