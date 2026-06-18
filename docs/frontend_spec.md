# フロントエンド仕様書

## 1. 概要

3DスキャンとAIで商品の傷を検出・可視化するフリマアプリのフロントエンド。

---

## 2. 技術スタック

| 領域 | 技術 |
|---|---|
| ビルドツール | Vite |
| フレームワーク | React |
| ルーティング | React Router v7（data mode） |
| スタイリング | CSS Modules |
| UIコンポーネント | Radix UI |
| フォーム | React Hook Form |
| 3Dビューア | @react-three/fiber + @react-three/drei |
| 認証 | Firebase Authentication |
| デプロイ | Vercel |

状態管理は素のReact（useState / useEffect / useContext）で対応。サーバーデータの取得はルートの `loader` 関数で行い、コンポーネント内では `useLoaderData()` で参照する。フォーム送信などのミューテーションはルートの `action` 関数で処理する。リアルタイム更新（WebSocket）は `useState` で管理する。

---

## 3. ディレクトリ構成

```
src/
├── components/             # 共通UIコンポーネント
│   ├── atoms/              # Button, Input, Badge, Avatar等
│   └── layout/             # Header, Sidebar, PageLayout等
│
├── utils/                  # 共通ロジック
│   ├── hooks/              # useWebSocket, useAuth等
│   ├── types/              # 共通型定義（Product, Order, Damage等）
│   └── constants/          # API_BASE_URL, ROUTES等
│
├── features/               # 機能単位
│   ├── auth/               # ログイン・サインアップ
│   ├── mypage/             # マイページ・購入済み・出品履歴
│   ├── products/           # 商品一覧・詳細
│   ├── listing/            # 出品フロー（撮影→情報入力→確認）
│   ├── orders/             # 購入フロー・注文管理
│   ├── messages/           # DM・取引詳細
│   └── damages/            # 傷報告・3D座標変換
│
└── pages/                  # ルーティングのエントリーポイント（薄いだけ）
```

**依存方向のルール**
```
pages → features → components / utils
```
- `features`同士は参照しない
- `utils`・`components`は`features`を参照しない

---

## 4. 認証

### Firebase Authentication

対応する認証方法は2種類。

| 方法 | 利用画面 |
|---|---|
| Google OAuth | ログイン・サインアップ共通 |
| メール／パスワード | ログイン・サインアップ共通 |

**Googleログインフロー**
```
1. 「Googleでログイン」ボタンをクリック
2. Firebase Auth で signInWithPopup（Google プロバイダ）
3. IDトークン取得
4. POST /api/users/register（初回のみ）
5. IDトークンをlocalStorageに保存
6. 以降のAPIリクエストにAuthorizationヘッダーとして付与
```

**メール／パスワード サインアップフロー**
```
1. メールアドレス・パスワード・パスワード確認を入力
2. Firebase Auth で createUserWithEmailAndPassword
3. IDトークン取得
4. POST /api/users/register
5. IDトークンをlocalStorageに保存
```

**メール／パスワード ログインフロー**
```
1. メールアドレス・パスワードを入力
2. Firebase Auth で signInWithEmailAndPassword
3. IDトークン取得 → localStorageに保存
```

---

## 5. APIクライアント

`apiFetch` はルートの `loader` / `action` から直接呼び出す汎用関数。コンポーネント内での直接呼び出しは避け、データ取得は `loader`、ミューテーションは `action` 経由にする。

---

## 6. WebSocket

`useWebSocket` フックで単一接続を管理。受信イベントは `new_message`・`damage_detection_complete`・`model_generation_complete` の3種類。

---

## 7. ナビゲーション

### レイアウト構成

**ヘッダー（上部固定）**
- 左：ロゴ（`/` へのリンク）
- 右：「出品する」ボタン + 未認証時はログイン・サインアップボタン / 認証済み時はアバター画像

アバター画像クリックで設定画面（プロフィール編集・ログアウト・アカウント削除）を表示。

**左サイドバー（固定）**

| アイコン | ラベル | リンク先 | 認証 |
|---|---|---|---|
| 🏠 | ホーム | / | 不要 |
| ♡ | いいね | /mypage/likes | 必要 |
| 📦 | 出品中 | /mypage/listing | 必要 |
| 💬 | 取引中 | /mypage/trades | 必要 |
| 👁️ | 閲覧履歴 | /mypage/history | 必要 |

未認証ユーザーがサイドバーの認証必須項目をクリックした場合は `/login` にリダイレクト。

---

## 8. 画面一覧

認証パターンの定義：
- **A：認証必須** — 未認証ユーザーは `/login` にリダイレクト
- **B：アクション時に認証** — ページは誰でも閲覧可能、特定アクション時に `/login` にリダイレクト
- **C：認証済みなら `/` にリダイレクト** — ログイン・サインアップ画面
- **D：認証不要** — 誰でもアクセス可能

| 画面 | パス | 認証パターン | 対応feature |
|---|---|---|---|
| ログイン | /login | C | auth |
| サインアップ | /signup | C | auth |
| ホーム | / | D | products |
| 商品詳細 | /products/:id | B（いいね・購入は認証必須） | products |
| 出品フロー | /listing | A | listing |
| 出品完了 | /listing/complete | A | listing |
| 購入確認 | /products/:id/purchase | A | orders |
| 購入完了 | /purchase/complete | D | orders |
| 取引詳細 | /orders/:id | A | messages |
| フィードバック | /orders/:id/feedback | A | orders |
| 傷報告 | /orders/:id/damage-report | A | damages |
| マイページ | /mypage | A | mypage |
| いいね一覧 | /mypage/likes | A | mypage |
| 出品中 | /mypage/listing | A | mypage |
| 取引中 | /mypage/trades | A | mypage |
| 閲覧履歴 | /mypage/history | A | mypage |

---

## 9. 主要画面の仕様

### 9-1. ログイン（/login）

- 「Googleでログイン」ボタン
- メールアドレス・パスワード入力フィールド
- ログインボタン
- 「アカウントをお持ちでない方はこちら」→ `/signup` へのリンク

### 9-2. サインアップ（/signup）

- 「Googleでサインアップ」ボタン
- メールアドレス・パスワード・パスワード確認入力フィールド
- 「アカウントを作成」ボタン
- 「すでにアカウントをお持ちの方はこちら」→ `/login` へのリンク
- バリデーション：パスワード不一致はボタン非活性またはエラー表示

### 9-3. ホーム（/）

- 商品一覧をグリッド表示
- 検索バー・カテゴリフィルター・価格帯フィルター・状態フィルター
- 無限スクロール（offset + limitで実装）
- 商品カードに `damage_count`・`condition` を表示

**ホバーインタラクション**
- 商品カードにホバーすると2D画像 → 3Dモデルに切り替わりその場で操作できる
- 3Dモデル上には傷ピンがマッピング済みの状態で表示
- `model.status === 'done'` の商品のみ切り替わる（生成中・未生成は2D画像のまま）

### 9-4. 商品詳細（/products/:id）

- 商品画像スライダー（5方向）
- AIレポートセクション（`GET /api/products/:id/damages` の結果を表示）
  - condition・condition_note の表示
  - 2D画像上への bboxマーカー表示（damages 一覧から描画）
  - ※ loader で damages を取得済み。bboxマーカー表示は AIレポートセクション実装時に追加する
- 3Dビューア + 傷ピン留め（3Dフェーズ・Week6-7）
- Q&Aセクション（コメント一覧・投稿）
- いいねボタン（未認証時はクリックで `/login` にリダイレクト）
- 購入するボタン（未認証時はクリックで `/login` にリダイレクト・出品者自身には非表示）

### 9-5. 出品フロー（/listing）

3ステップのフロー。

**Step1: ガイド付き撮影**
- 5方向（正面・背面・右・左・上）を順番に撮影
- スマホブラウザ：`getUserMedia` APIでカメラ起動、ガイド付き撮影UI
- PCブラウザ：`<input type="file">` でファイルアップロード（フォールバック）
- 撮影完了後 `POST /api/images` を呼び出し傷検出を非同期開始

**Step2: 商品情報入力**
- 傷検出バックグラウンド実行中（WebSocketで完了を待機）
- React Hook Formでタイトル・説明・価格・カテゴリを入力
- AIが生成したcondition_noteを確認できる

**Step3: 出品確認**
- 傷検出完了で「出品する」ボタンが活性化
- `POST /api/products` を呼び出して出品

### 9-6. 出品完了（/listing/complete）

- 「出品しました」の完了メッセージ
- 「商品を見る」ボタン → `/products/:id` に遷移
- 「ホームに戻る」ボタン → `/` に遷移

### 9-7. マイページ（/mypage）

- ⭐️ 平均評価スコア・件数
- プロフィール編集
- 出品した商品一覧（全ステータス：出品中・売却済み）
- 購入した商品一覧
  - `orders.status = 'pending'`（取引中）→ タップで取引詳細（`/orders/:id`）に遷移
  - `orders.status = 'completed'`（受け取り済み）→ タップで商品詳細（`/products/:id`）に遷移

### 9-8. 取引詳細（/orders/:id）

- WebSocketでリアルタイムDM
- 受け取り完了ボタン（buyer）→ `/orders/:id/feedback` に遷移
- キャンセルボタン（buyer / seller）

### 9-9. フィードバック（/orders/:id/feedback）

- ⭐️ 5段階評価
- 報告済み傷一覧（件数・サムネイル）
- 「傷を報告する」ボタン → `/orders/:id/damage-report` に遷移（複数回可）
- 「フィードバックを送信」ボタン → 送信後は再送不可、完了トースト表示
- 「この報告はAIの精度向上のために使用されます」の注記
- `POST /api/orders/:id/feedback` を呼び出し

### 9-10. 傷報告（/orders/:id/damage-report）

- カメラ起動（スマホ：`getUserMedia` / PC：ファイルアップロード）
- 写真上に手動でbboxを描いて傷箇所を指定
- 送信ボタン → `/orders/:id/feedback` に戻り右上にトースト「傷報告が完了しました」
- `POST /api/orders/:id/damage-reports` を呼び出し

---

## 10. デザイン方針

- **全体トーン**：グラスモーフィズム（3Dビューア周辺に集中）
- **3D以外**：シンプルで清潔感のあるUI
- **CSS Modules**でコンポーネントスコープのスタイル管理
- PCブラウザでの利用を主想定。`/listing` の撮影ステップのみスマホブラウザ対応。フルレスポンシブ対応はスコープ外。

---

## 11. 環境変数

| 変数名 | 説明 |
|---|---|
| VITE_API_BASE_URL | バックエンドAPIのベースURL |
| VITE_WS_BASE_URL | WebSocketのベースURL |
| VITE_FIREBASE_API_KEY | Firebase APIキー |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth ドメイン |
| VITE_FIREBASE_PROJECT_ID | FirebaseプロジェクトID |
