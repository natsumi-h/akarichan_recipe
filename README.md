# akarichan_recipe with OpenAI Vector Embeddings

レシピアプリの検索＆レコメンド機能開発から考えるクエリ、インデックス効率化

## Motivation

- Inspire High の **複数のプロダクト間での意味的な連携を生成して、問いを深められる体験をどのように実現できるか？** ということが思考の棚に眠っていました。
- カテゴリーやタグなどの付与をユーザーや管理者が属人的に実施すると膨大なメンテナンスコストが発生するため、なにか他の方法で実現できないか、考えました。
- さらに同時に思考の棚にあった、 **「日本語というマルチキャラクターであり、言い換え表現も多く、かつ最小限の意味単位をスペースで区切ることができない特殊な言語において、一般的なソフトウェアでどのように検索アルゴリズムが実装されているのか」** ということを考えるために、個人的な US を実現するレシピ検索アプリの MVP を開発しました。

## Who is 長谷川あかり

- 多作。SNS ベースで活動しているのでフロー型。書籍は多数出ているが検索性、アクセスの容易さに欠ける。
  - [Instagtram](https://www.instagram.com/akari_hasegawa0105/?hl=ja)
  - [X](https://x.com/akari_hasegawa?lang=ja)
  - [Amazon](https://www.amazon.co.jp/stores/author/B0D9LHZGKJ?ingress=0&visitId=2267d384-b4a9-42c0-b58a-0cfc86bd0f7c&ref_=sr_ntt_srch_lnk_1)

## Pain Points

- ちゃんと DB 化して辞書引きしたい
- 薬味をふんだんに使うので一度に使い切れない事象が発生する
  - ex. 次の日もしょうがを消費するために別のしょうがのレシピも探したい
- 書籍は表記ゆれがない。鳥 ↔ 鶏肉、大葉 ↔ しそ、大根 ↔ だいこん、生姜 ↔ しょうがレシピうまくひっかからないのは困る

## 達成したかった USs

- ユーザーは、検索ワードに対して完全表記一致したレシピだけではなく、意味的に一致するレシピが一覧できる。
  - 全文検索は断念、かわりに LIKE と synonyms のかけあわせで実現
- ユーザーは、閲覧しているレシピに基づいた類似のレシピを一覧できる。（レコメンデーション機能）
  - Open AI Vecror Embeddings

## 検索機能実装
- DBスキーマ
<img width="917" height="675" alt="supabase-schema-uhtvjhcludivyltnlusg" src="https://github.com/user-attachments/assets/f715a5b6-3111-43db-9dda-c4cf8e784c93" />

- synonymsとのリレーション
    - レシピのJSONデータ生成（Claude Codeで自動解析）
    - 牛細切れ肉⇒ぎゅうこまぎれにくで正規化し、ingredientsに登録
    - synonyms.canonicalname（とり、ぶた、にんにくなど）が、部分一致するingredientsがあれば、そのingredientsと、synonyms.synonymsのすべてとリレーションを結ぶ

  ```json
  {
  "synonyms_array": [
    {
      "canonical_name": "とり",
      "synonyms": [
        "チキン",
        "鳥",
        "とり",
        "鶏肉",
        "とりにく",
        "鳥肉",
        "とりむね",
        "とりもも"
      ]
    },
  ]
  }
  ```

## 「こちらもおすすめ」実装

- ts_vector による全文検索（日本語は対象外だったので断念）
- Elastic Search（ハードル高くて今回は断念）
- **Embedding(vector) x OpenAI Vector embeddings**
  - コスト
  - ベクトルとは
    - テキスト、画像、音声などのデータを機械学習モデル（特に大規模言語モデル/LLM）によって数値の配列（**埋め込み/Embedding**）として表現したものです。これにより、データ間の意味的な類似性を計算できます。
    - ベクトルデータの最も重要な用途は、**類似性検索（Similarity Search）**です。
      `pgvector`を使用すると、特定のベクトルに「最も近い」ベクトル（つまり、意味的に最も類似したデータ）を見つけることができます。

## まとめ

- 日本語 DB で検索クエリを開発をすることの難しさ
- 今後そこを AI が埋めてくれるかも
