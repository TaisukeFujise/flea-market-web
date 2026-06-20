# Loupe Design System

## 1. Overview

### Service
Loupe

### Concept
中古取引において、商品状態という不確実なものをAI判定に委ねることで、出品者の努力と購入者の安心感を担保するマーケットプレイス。

---

# 2. Brand Principles

## Trust First
デザインの最優先事項は「安心感」。

## AI is Supportive
AIを主役にしすぎない。
あくまで取引を補助する存在として表現する。

## Reduce Cognitive Load
情報量は多くても、理解コストは低く保つ。

## Generous Whitespace
余白を積極的に使い、高級感と視認性を担保する。

---

# 3. Design References

- Apple Store
- StockX
- Mercari
- Notion

---

# 4. Color System

```css
--background: #F5F5F5;
--surface: #FFFFFF;

--primary: #7373C7;
--primary-hover: #232382;
--primary-soft: #C3C3E8;

--success-soft: #D2DDC6;

--text-primary: #232382;
--text-secondary: #5C5C75;

--border: #E8E8EF;

/* Feedback */
--error: #C75F73;
--error-soft: #F4DDE3;

--warning: #C7A15F;
--warning-soft: #F3E8C8;

--info: #5F8CC7;
--info-soft: #DDE8F4;
```

---

# 5. Condition Colors

```css
--condition-excellent-bg: #F4F3FF;
--condition-excellent-text: #7373C7;

--condition-good-bg: #F8F8EC;
--condition-good-text: #7C7C42;

--condition-used-bg: #FFF3EB;
--condition-used-text: #C9743C;
```

---

# 6. Typography

## Font Family
Plus Jakarta Sans

## Font Weight
400 Regular  
500 Medium  
600 SemiBold  
700 Bold  

## Font Scale

Display: 48px  
Hero: 56px〜64px  
Heading1: 36px  
Heading2: 28px  
Heading3: 24px  
Body: 16px  
Caption: 14px  
Small: 12px  

---

# 7. Spacing

```text
4
8
12
16
24
32
48
64
```

Usage:

Page Padding: 32px  
Card Padding: 16px  
Section Gap: 48px  
Component Gap: 12px  

---

# 8. Radius

Small: 10px  
Medium: 14px  
Large: 20px  
Pill: 9999px  

---

# 9. Border

```css
border: 1px solid var(--border);
```

基本的には border で区切り、強い影は使用しない。

---

# 10. Shadow

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 16px rgba(0,0,0,0.06);
--shadow-hover: 0 10px 28px rgba(35,35,130,0.10);
```

商品カードは hover 時に軽く浮き上がる。

```css
.product-card {
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.product-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-hover);
}
```

---

# 11. Layout System

Desktop First で実装する。

Container Max Width: 1440px  
Page Padding: 32px  

Desktop Grid: 12 columns  
Tablet Grid: 8 columns  
Mobile Grid: 4 columns  

---

# 12. Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1440px;
```

---

# 13. Motion

Hover: 150ms  
Modal: 200ms  
Page Transition: none  

商品カードには `scale(1.02)` 程度の hover animation を付与する。

---

# 14. Navigation

Header:
- Logo（`/` へのリンク）
- Search
- 「出品する」ボタン
- 未認証時：ログイン・サインアップボタン
- 認証済み時：アバター（クリックでドロップダウン）
  - マイページ（`/mypage`）
  - ログアウト
  - アカウント削除

マイページ（`/mypage`）からいいね・出品中・取引中・閲覧履歴へ遷移する。

サイドバーは使用しない。

---

# 15. Home Page

## Structure

Header  
↓  
Category Navigation  
↓  
Hero Section  
↓  
Filter Bar  
↓  
Product Grid  
↓  
Load More  

---

## Hero Section

トップページにのみ表示する。  
スクロール後に固定表示しない。

### Copy

商品の状態をAIレポートに

### CTA

出品してみる

---

## Filter Bar

- Category
- Condition
- AI Condition
- Price
- Sort

AI Condition による絞り込みを追加する。

---

# 16. Product Card

## Contents

- Product Image
- AI Checked Badge
- Product Title
- Price
- Condition Badge
- Like Button

## Image Ratio

4:5

---

# 17. Product Detail

## Layout

Left:
- Image Gallery

Right:
- Title
- Price
- Condition
- Purchase Button
- Like Button
- Seller

Below:
- AI Report
- Description

購入ボタンは sticky で常時表示する。

---

# 18. Condition System

状態は3段階。APIの `condition` フィールド（`good` / `fair` / `poor`）と以下のようにマッピングする。

| condition | ラベル | カラー変数 |
|---|---|---|
| good | 🟣 ほぼ新品 | `--condition-excellent-*` |
| fair | 🟡 目立つ傷少なめ | `--condition-good-*` |
| poor | 🟠 使用感あり | `--condition-used-*` |

---

# 19. AI Report

AI Report の検出項目は以下の3つ。

```text
scratch
dirt
wear
```

## Display Labels

scratch: 傷  
dirt: 汚れ  
wear: 使用感  

## AI Comment

AIコメントまで生成する。

Example:

```text
通常使用に支障のある損傷は検出されていません。目立つ傷や汚れは少なく、全体的に良好な状態です。
```

---

# 20. Components

- Button
- Input
- Search Bar
- Select
- Badge
- Card
- Tabs
- Avatar
- Dropdown
- Modal
- Toast
- Skeleton
- Pagination
