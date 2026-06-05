# フロントエンド仕様書

## 1. 概要

3DスキャンとAIで商品の傷を検出・可視化するフリマアプリのフロントエンド。

---

## 2. 技術スタック

| 領域 | 技術 |
|---|---|
| ビルドツール | Vite |
| フレームワーク | React |
| ルーティング | React Router v7 |
| スタイリング | CSS Modules |
| UIコンポーネント | Radix UI |
| フォーム | React Hook Form |
| 3Dビューア | @react-three/fiber + @react-three/drei |
| 認証 | Firebase Authentication |
| デプロイ | Vercel |

状態管理・データフェッチは素のReact（useState / useEffect / useContext）で対応。

---

## 3. ディレクトリ構成

```
src/
├── components/             # 共通UIコンポーネント
│   ├── atoms/              # Button, Input, Badge, Avatar等
│   └── layout/             # Header, BottomNav, PageLayout等
│
├── utils/                  # 共通ロジック
│   ├── hooks/              # useWebSocket, useFetch, useAuth等
│   ├── types/              # 共通型定義（Product, Order, Damage等）
│   └── constants/          # API_BASE_URL, ROUTES等
│
├── features/               # 機能単位
│   ├── auth/               # ログイン・サインアップ
│   ├── mypage/             # マイページ・いいね・履歴・購入済み
│   ├── products/           # 商品一覧・詳細
│   ├── listing/            # 出品フロー（撮影→情報入力→確認）
│   ├── orders/             # 購入フロー・注文管理
│   ├── messages/           # DM・取引詳細
│   └── damages/            # 傷報告・3D座標変換
│
└── pages/                  # ルーティングのエントリーポイント（薄いだけ）
    ├── LoginPage.tsx
    ├── SignupPage.tsx
    ├── HomePage.tsx
    ├── ProductDetailPage.tsx
    ├── ListingPage.tsx
    ├── PurchaseConfirmPage.tsx
    ├── PurchaseCompletePage.tsx
    ├── OrderDetailPage.tsx
    ├── MessageRoomPage.tsx
    ├── MyPage.tsx
    ├── LikesPage.tsx
    ├── HistoryPage.tsx
    └── PurchasedPage.tsx
```

**依存方向のルール**
```
pages → features → components / utils
```
- `features`同士は参照しない
- `utils`・`components`は`features`を参照しない

---

## 4. ルーティング

```tsx
// src/utils/constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PRODUCT_DETAIL: '/products/:id',
  LISTING: '/listing',
  PURCHASE_CONFIRM: '/products/:id/purchase',
  PURCHASE_COMPLETE: '/purchase/complete',
  ORDER_DETAIL: '/orders/:id',
  MESSAGE_ROOM: '/messages/:id',
  MYPAGE: '/mypage',
  MYPAGE_LIKES: '/mypage/likes',
  MYPAGE_HISTORY: '/mypage/history',
  MYPAGE_PURCHASED: '/mypage/purchased',
} as const
```

```tsx
// src/App.tsx
const router = createBrowserRouter([
  { path: '/',                      element: <HomePage /> },
  { path: '/login',                 element: <LoginPage /> },
  { path: '/signup',                element: <SignupPage /> },
  { path: '/products/:id',          element: <ProductDetailPage /> },
  { path: '/listing',               element: <ListingPage />,           /* 要認証 */ },
  { path: '/products/:id/purchase', element: <PurchaseConfirmPage />,   /* 要認証 */ },
  { path: '/purchase/complete',     element: <PurchaseCompletePage />,  /* 要認証 */ },
  { path: '/orders/:id',            element: <OrderDetailPage />,       /* 要認証 */ },
  { path: '/messages/:id',          element: <MessageRoomPage />,       /* 要認証 */ },
  { path: '/mypage',                element: <MyPage />,                /* 要認証 */ },
  { path: '/mypage/likes',          element: <LikesPage />,             /* 要認証 */ },
  { path: '/mypage/history',        element: <HistoryPage />,           /* 要認証 */ },
  { path: '/mypage/purchased',      element: <PurchasedPage />,         /* 要認証 */ },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
```

`main.tsx` は `<App />` を mount するだけ。未認証ユーザーが認証必須ルートにアクセスした場合は `/login` にリダイレクト。

---

## 5. 認証

### Firebase Authentication

対応する認証方法は2種類。

| 方法 | 利用画面 |
|---|---|
| Google OAuth | ログイン・サインアップ共通 |
| メール／パスワード | ログイン・サインアップ共通 |

**Googleログインフロー**
```
1. 「Googleでログイン」ボタンをタップ
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

### AuthContext

```tsx
// src/utils/hooks/useAuth.ts
const AuthContext = createContext<AuthContextType>(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Firebase AuthのonAuthStateChangedを監視
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken()
        setToken(idToken)
        setUser(firebaseUser)
      } else {
        setToken(null)
        setUser(null)
      }
    })
    return unsubscribe
  }, [])

  return <AuthContext.Provider value={{ user, token }}>{children}</AuthContext.Provider>
}
```

---

## 6. APIクライアント

```tsx
// src/utils/hooks/useFetch.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const apiFetch = async (path: string, options: RequestInit = {}, token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error?.message ?? 'API Error')
  }

  return res.json()
}
```

---

## 7. WebSocket

```tsx
// src/utils/hooks/useWebSocket.ts
export const useWebSocket = (token: string | null) => {
  const [socket, setSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    if (!token) return

    const ws = new WebSocket(`${WS_BASE_URL}/ws?token=${token}`)

    ws.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data)

      switch (type) {
        case 'new_message':
          // メッセージルームのキャッシュ更新
          break
        case 'damage_detection_complete':
          // 出品フローの傷検出完了通知
          break
        case 'model_generation_complete':
          // 3Dモデル生成完了通知（3Dフェーズ）
          break
      }
    }

    setSocket(ws)
    return () => ws.close()
  }, [token])

  return socket
}
```

---

## 8. 画面一覧

| 画面 | パス | 認証 | 対応feature |
|---|---|---|---|
| ログイン | /login | 不要 | auth |
| サインアップ | /signup | 不要 | auth |
| ホーム | / | 不要 | products |
| 商品詳細 | /products/:id | 不要（いいね・購入は必要） | products |
| 出品フロー | /listing | 必要 | listing |
| 購入確認 | /products/:id/purchase | 必要 | orders |
| 購入完了 | /purchase/complete | 必要 | orders |
| 取引詳細 | /orders/:id | 必要 | messages |
| マイページ | /mypage | 必要 | mypage |
| いいね一覧 | /mypage/likes | 必要 | mypage |
| 閲覧履歴 | /mypage/history | 必要 | mypage |
| 購入した商品 | /mypage/purchased | 必要 | mypage |

---

## 9. 主要画面の仕様

### 9-1. ログイン（/login）

- 「Googleでログイン」ボタン
- メールアドレス入力フィールド
- パスワード入力フィールド
- ログインボタン
- 「アカウントをお持ちでない方はこちら」→ `/signup` へのリンク
- 認証済みユーザーがアクセスした場合は `/` にリダイレクト

### 9-2. サインアップ（/signup）

- 「Googleでサインアップ」ボタン
- メールアドレス入力フィールド
- パスワード入力フィールド
- パスワード確認入力フィールド
- 「アカウントを作成」ボタン
- 「すでにアカウントをお持ちの方はこちら」→ `/login` へのリンク
- 認証済みユーザーがアクセスした場合は `/` にリダイレクト
- バリデーション：パスワード不一致はボタン非活性 or エラー表示

### 9-3. ホーム（/）

- 商品一覧をグリッド表示
- 検索バー・カテゴリフィルター・価格帯フィルター・状態フィルター
- 無限スクロール（offset + limitで実装）
- 商品カードに `damage_count` ・ `condition` を表示

**ホバーインタラクション**
- 商品カードにホバーすると2D画像 → 3Dモデルに切り替わりその場で操作できる
- 3Dモデル上には傷ピンがマッピング済みの状態で表示
- `model.status === 'done'` の商品のみ切り替わる（生成中・未生成は2D画像のまま）

### 9-4. 商品詳細（/products/:id）

- 商品画像スライダー（5方向）
- 2D画像上にbboxマーカー表示（damages一覧から描画）
- 3Dビューア + 傷ピン留め（3Dフェーズ・Week6-7）
- condition_noteの表示
- Q&Aセクション（コメント一覧・投稿）
- いいねボタン
- 購入するボタン（出品者自身には非表示）

### 9-5. 出品フロー（/listing）

3ステップのフロー。

**Step1: ガイド付き撮影**
- 5方向（正面・背面・右・左・上）を順番に撮影
- スマホカメラAPIで撮影
- 撮影完了後 `POST /api/images` を呼び出し傷検出を非同期開始

**Step2: 商品情報入力**
- 傷検出バックグラウンド実行中（WebSocketで完了を待機）
- React Hook Formでタイトル・説明・価格・カテゴリを入力
- AIが生成したタイトル・説明・condition_noteを確認・編集できる

**Step3: 出品確認**
- 傷検出完了で「出品する」ボタンが活性化
- `POST /api/products` を呼び出して出品

### 9-6. 取引詳細（/orders/:id）

- WebSocketでリアルタイムDM
- 受け取り完了ボタン（buyer）
- キャンセルボタン（buyer / seller）
- 傷を報告するボタン（buyer・completed状態のみ）

### 9-7. 傷報告

- 商品画像上でbboxを描画して報告（2Dフェーズ）
- 3Dモデル上でタップして報告（3Dフェーズ・保留）
- `POST /api/orders/:id/damage-reports` を呼び出し

---

## 10. デザイン方針

- **全体トーン**：グラスモーフィズム（3Dビューア周辺に集中）
- **3D以外**：シンプルで清潔感のあるUI
- **CSS Modules**でコンポーネントスコープのスタイル管理
- Webブラウザ（PC）での利用を想定

---

## 11. 環境変数

| 変数名 | 説明 |
|---|---|
| VITE_API_BASE_URL | バックエンドAPIのベースURL |
| VITE_WS_BASE_URL | WebSocketのベースURL |
| VITE_FIREBASE_API_KEY | Firebase APIキー |
| VITE_FIREBASE_AUTH_DOMAIN | Firebase Auth ドメイン |
| VITE_FIREBASE_PROJECT_ID | FirebaseプロジェクトID |

