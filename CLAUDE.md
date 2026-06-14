# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Type-check + production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test runner is configured yet.

## Architecture

This is a flea market web app featuring AI-powered product damage detection (傷検出) and 3D model visualization.

**Tech stack:** React 19 + TypeScript + Vite, CSS Modules, Radix UI, React Hook Form, `@react-three/fiber` + `@react-three/drei` for 3D, Firebase Authentication, React Router v7 (data mode).

**Entry point:** `main.tsx` mounts `<App />` only. `App.tsx` owns the router definition (`createBrowserRouter`) and top-level providers (`AuthProvider`). Routes declare `loader` / `action` functions for data fetching and mutations; `errorElement` for per-route error boundaries.

**State management:** Vanilla React — `useState` / `useEffect` / `useContext`. No external state library. Server data is fetched via route `loader`s (accessed with `useLoaderData()`), not bare `useEffect`. Mutations go through route `action`s or direct `apiFetch` calls. Real-time updates (WebSocket) use `useState`.

### Directory layout

```
src/
├── App.tsx                        # ルーター定義 + Provider組み立てのみ
├── firebase.ts                    # Firebase初期化（アプリに1つ）
│
├── utils/                         # featureに依存しない共通ロジック
│   ├── api.ts                     # apiFetch（HTTPクライアント・トークン管理）
│   ├── auth.ts                    # registerUser, protectedLoader, guestOnlyLoader
│   ├── types/
│   │   └── index.ts               # API仕様書から導出した全型定義
│   └── hooks/
│       ├── useAuth.ts             # useAuth フック + AuthContext（JSXなし .ts）
│       └── AuthProvider.tsx       # AuthProvider コンポーネントのみ（.tsx）
│
├── components/                    # 複数featureをまたぐ共通UI
│   ├── atoms/                     # Button, Input, Badge, Avatar など
│   └── layout/                    # Layout, Header, Sidebar
│
└── features/                      # 機能単位のスライス
    ├── auth/                      # ログイン・サインアップ
    ├── products/                  # 商品一覧・詳細
    ├── listing/                   # 出品フロー
    ├── orders/                    # 購入フロー・注文管理
    ├── messages/                  # DM・取引詳細
    ├── damages/                   # 傷報告
    └── mypage/                    # マイページ各種
```

**Dependency rule:** `features → components / utils`. Features must not import from other features; `components` and `utils` must not import from `features`.

### features/ のファイル命名規則

各 feature ディレクトリには以下の3種類のファイルを置く。

| ファイル | 内容 | 拡張子 |
|---|---|---|
| `XxxPage.tsx` | ページコンポーネントのみ | `.tsx` |
| `xxxLoader.ts` | React Router `loader` 関数のみ（GET） | `.ts` |
| `xxxAction.ts` | React Router `action` 関数のみ（POST/PATCH/DELETE） | `.ts` |

**コンポーネントと loader/action を同じファイルに書かない。** Vite の Fast Refresh はコンポーネントだけをexportするファイルにのみ正しく動作するため。

```
features/products/
├── HomePage.tsx           # export default HomePage（コンポーネントのみ）
├── homeLoader.ts          # export homeLoader（loaderのみ）
├── ProductDetailPage.tsx
└── productDetailLoader.ts
```

App.tsx でloaderとコンポーネントを組み合わせてルートを定義する：

```tsx
import { homeLoader } from './features/products/homeLoader'
import HomePage from './features/products/HomePage'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', loader: homeLoader, element: <HomePage /> },
    ],
  },
])
```

### Auth

Firebase Authentication（Google OAuth + メール/パスワード）。サインイン後、Firebase ID トークンを `localStorage` に保存し、全APIリクエストに `Authorization: Bearer <token>` として付与。

- `AuthContext` + `useAuth` — `src/utils/hooks/useAuth.ts`（JSXなし）
- `AuthProvider` — `src/utils/hooks/AuthProvider.tsx`（コンポーネントのみ）
- `protectedLoader` / `guestOnlyLoader` — `src/utils/auth.ts`

トークン期限切れ（1時間）は `apiFetch` が `401` を受け取ったとき `getIdToken(true)` で自動リフレッシュし、同リクエストを1回再試行する。

### API & WebSocket

- REST calls go through `apiFetch` (`src/utils/api.ts`) using `VITE_API_BASE_URL`.
- 型定義は `src/utils/types/index.ts` に集約。API仕様書（`docs/api_spec.md`）が唯一の根拠。バックエンド未実装のAPIの型には `// TODO: バックエンド未実装` を付ける。
- WebSocket (`useWebSocket`) connects to `VITE_WS_BASE_URL/ws?token=<idToken>` and handles three event types: `new_message`, `damage_detection_complete`, `model_generation_complete`.

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend REST API base URL |
| `VITE_WS_BASE_URL` | WebSocket base URL |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |

### Key product flows

- **Listing (出品):** 3-step flow — guided photo capture (5 angles via camera API) → product info form (damage detection runs in background via WebSocket) → confirm & publish. The "publish" button activates only after damage detection completes.
- **Product card hover:** When `model.status === 'done'`, hovering a product card switches from the 2D image to an interactive 3D model with damage pins.
- **Damage report (傷報告):** Buyer draws a bbox on the product image (2D phase) or taps the 3D model (3D phase) to submit a report via `POST /api/orders/:id/damage-reports`.

Full screen specs and the screen flow diagram are in `docs/frontend_spec.md` and `docs/screen_flow_diagram.md`.

## Styling policy

CSS will be refined by the developer later. Keep CSS **minimal** when implementing new components and pages — enough to make the feature functional and structurally correct, but don't invest in fine-tuned spacing, hover effects, or visual polish. Skeleton styles are fine.

- **CSS Modules のみ使う。インラインスタイルは書かない。** 新しいページ・コンポーネントには必ず対応する `*.module.css` を作成する。
- 書いてよいスタイル: `display: flex/grid`、幅・高さの大枠、ボーダー（色なし `#ddd` 程度）
- 書かないスタイル: ブランドカラー・hover・shadow・border-radius の細かい調整・アニメーション

## State management guidelines

- **関連する state が 3 つ以上まとめて変わる場合は `useReducer` を使う**（例: items / offset / total / loading の組み合わせ）
- **他の state から計算できる値は state に持たない**（例: `hasMore = offset < total`）
- **`useEffect` の本体で同期的に `setState` を呼ばない**（React Compiler が警告する。遅延初期化・`useCallback` 等で代替する）
- `useCallback` を使う場合は依存配列を正確に書き、eslint-disable コメントで誤魔化さない

## API error handling

- ページの主データ（商品一覧など）の fetch 失敗は throw してよい（Router の errorElement が受け取る）
- **ページに必須でない補助データ（カテゴリ等）は `Promise.all` にまとめず、`catch(() => [])` でフォールバックする**
- `Promise.all` は全件必須の場合のみ使う

## Definition of done

実装が完了したら必ず以下を実行し、両方通ることを確認してから報告する：

```bash
npm run lint   # エラー 0 件（warning は許容）
npm run build  # 型エラー・ビルドエラーなし
```
