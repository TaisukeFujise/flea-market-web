以下の手順で実装してください。

## Step 1: 事前確認（コードを書く前に）

issue 番号が指定された場合は、以下のコマンドで内容を取得する（ユーザーに確認しない）：

```bash
gh issue view <番号> --repo TaisukeFujise/flea-market-web
```

その後、`flea-market-web/docs/api_spec.md` / `flea-market-web/docs/frontend_spec.md` / `flea-market-web/docs/design.md` を読む。
その他、バックエンドの不明点があれば、`flea-market-api/*`のコードを参照すること。

- 実装スコープ（どのファイルを触るか）を明確にする
 
## Step 2: 実装の制約

### ファイル構成
- コンポーネントと loader/action を同じファイルに書かない
- 新しいページには必ず `XxxPage.tsx` + `xxxLoader.ts` に分ける

### スタイル
- **CSS Modules のみ**（`*.module.css`）。インラインスタイル禁止
- 書くのはレイアウト構造（flex/grid・幅・余白の大枠）のみ
- 色・hover・shadow・細かい border-radius は書かない

### State 管理
- 関連する state が 3 つ以上まとめて変わるなら `useReducer` を使う
- 他 state から計算できる値は state に持たない（派生値にする）
- `useEffect` 本体で同期的に `setState` を呼ばない

### API
- ページの主データの fetch 失敗は throw でよい
- 補助データ（カテゴリ等、なくても画面が成立するもの）は `.catch(() => [])` でフォールバックする

### 型
- 型定義は `src/utils/types/index.ts` に集約し、`flea-market-web/docs/api_spec.md` を唯一の根拠にする
- バックエンド未実装の型には `// TODO: バックエンド未実装` を付ける

## Step 3: 完了条件

実装後、必ず以下を実行して両方通ることを確認してから報告する：

```bash
npm run lint   # エラー 0 件（warning は許容）
npm run build  # 型エラー・ビルドエラーなし
```
