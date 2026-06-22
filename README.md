# Loupe — 中古品の状態確認を変えるフリマアプリ

AIによる商品の傷検出と3Dモデルへの傷マッピングを備えたフリマWebアプリのフロントエンドです。

これにより、「写真が出品者ごとにバラつき比較しにくい問題」と「主観的な状態評価によるトラブル」を解消します。


**<関連リポジトリ>：** [バックエンド](https://github.com/TaisukeFujise/flea-market-api)

## デモ

中古品の状態確認を変えるフリマアプリ「Loupe」のデモ動画です。  
商品詳細画面でAIが検出した傷情報を確認し、3DモデルのDamage Pinで傷の位置を直感的に把握できます。

<a href="https://youtu.be/xpiIk5NCf9U">
  <img src="https://img.youtube.com/vi/xpiIk5NCf9U/maxresdefault.jpg" width="600">
  <br>▶ デモを見る
</a>

## 主な機能

- 商品一覧・検索・カテゴリ絞り込み
- 出品フロー（5方向撮影 → 商品情報入力 → 確認・公開）・商品編集
- AI傷検出（撮影後バックグラウンドで自動実行）
- 3Dモデルビューア（モーダルで2D/3D切り替え・傷ピン表示）
- 傷報告（画像上のbbox描画 / 3Dモデルタップ）
- 購入フロー（購入確認 → 完了）
- 評価・フィードバック
- DMによる取引メッセージ
- マイページ（購入・販売履歴、いいね一覧、出品一覧、取引中一覧）
- Firebase Authentication（Google OAuth + メール/パスワード）

## 技術スタック

| 領域 | 技術 |
|---|---|
| フレームワーク | React 19 + TypeScript + Vite |
| ルーティング | React Router v7（data mode） |
| スタイリング | CSS Modules |
| UIコンポーネント | Radix UI |
| フォーム | React Hook Form |
| 3Dビューア | @react-three/fiber + @react-three/drei |
| 認証 | Firebase Authentication |

## セットアップ

```bash
npm install
cp .env.example .env  # 環境変数を設定
npm run dev
```

### 環境変数

| 変数 | 用途 |
|---|---|
| `VITE_API_BASE_URL` | バックエンドREST APIのベースURL |
| `VITE_WS_BASE_URL` | WebSocketのベースURL |
| `VITE_FIREBASE_API_KEY` | Firebase APIキー |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authドメイン |
| `VITE_FIREBASE_PROJECT_ID` | FirebaseプロジェクトID |

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド（型チェック含む）
npm run lint     # ESLint実行
npm run preview  # 本番ビルドをローカルでプレビュー
```

## ドキュメント

- [フロントエンド仕様書](docs/frontend_spec.md)
- [API仕様書](docs/api_spec.md)
- [画面遷移図](docs/screen_flow_diagram.md)
- [デザイン](docs/design.md)
