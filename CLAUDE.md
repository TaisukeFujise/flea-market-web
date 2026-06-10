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

**State management:** Vanilla React — `useState` / `useEffect` / `useContext`. No external state library. Server data is fetched via route `loader`s (accessed with `useLoaderData()`), not bare `useEffect`. Mutations go through route `action`s or direct `apiFetch` calls. Real-time updates (WebSocket) still use `useState`.

### Directory layout (planned — `src/` is currently the Vite default template)

```
src/
├── components/         # Shared UI: atoms/ (Button, Input, Badge…) and layout/ (Header, BottomNav…)
├── utils/
│   ├── hooks/          # useAuth, useFetch, useWebSocket, …
│   ├── types/          # Shared types: Product, Order, Damage, …
│   └── constants/      # API_BASE_URL, WS_BASE_URL, ROUTES
├── features/           # Feature slices: auth, mypage, products, listing, orders, messages, damages
└── pages/              # Thin route entry points — just render the feature component
```

**Dependency rule:** `pages → features → components / utils`. Features must not import from other features; `components` and `utils` must not import from `features`.

### Auth

Firebase Authentication with Google OAuth. After sign-in, the Firebase ID token is stored in `localStorage` and attached as a `Bearer` token on every API request. `AuthContext` (`src/utils/hooks/useAuth.ts`) wraps `onAuthStateChanged` and exposes `{ user, token }`. Unauthenticated users hitting protected routes are redirected via a shared `protectedLoader` that calls `redirect('/login')` — not component-level redirects.

### API & WebSocket

- REST calls go through `apiFetch` (`src/utils/hooks/useFetch.ts`) using `VITE_API_BASE_URL`.
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
