```mermaid
flowchart TD
    subgraph LAYOUT[共通レイアウト]
        subgraph HEADER[ヘッダー]
            LOGO[ロゴ]
            SELL_BTN[出品するボタン]
            AUTH_BTN[ログイン / サインアップボタン\n※未認証時]
            AVATAR[アバター\n※認証済み時]
        end
        subgraph SIDEBAR[左サイドバー]
            NAV_HOME[🏠 ホーム]
            NAV_LIKES[❤️ いいね]
            NAV_LISTING[📦 出品中]
            NAV_TRADES[💬 取引中]
            NAV_HISTORY[👁️ 閲覧履歴]
        end
    end

    subgraph DROPDOWN[ドロップダウン\nアバタークリックで開く]
        DD_MYPAGE[マイページ]
        DD_LOGOUT[ログアウト]
        DD_DELETE[アカウント削除]
    end

    subgraph AUTH[認証]
        LOGIN[🔐 ログイン\n/login]
        SIGNUP[📝 サインアップ\n/signup]
    end

    HOME[🏠 ホーム\n/\n商品グリッド・検索・フィルター]

    subgraph PRODUCT[商品]
        PRODUCT_DETAIL[🎧 商品詳細\n/products/:id\n3Dビューア・傷ピン・Q&A]
        PRODUCT_EDIT[✏️ 商品編集\n/products/:id/edit]
    end

    subgraph PURCHASE[購入フロー]
        PURCHASE_CONFIRM[💳 購入確認\n/products/:id/purchase]
        PURCHASE_COMPLETE[✅ 購入完了\n/purchase/complete]
    end

    subgraph LISTING_FLOW[出品フロー]
        SHOOTING[📸 Step1: ガイド付き撮影\nスマホ:カメラAPI / PC:ファイルアップロード]
        PRODUCT_INFO[📝 Step2: 商品情報入力\n傷検出バックグラウンド実行中]
        LISTING_CONFIRM[✔️ Step3: 出品確認\n傷検出完了で出品ボタン活性化]
        LISTING_COMPLETE[🎉 出品完了\n/listing/complete]
    end

    subgraph TRADE[取引フロー]
        TRADE_DETAIL[💬 取引詳細\n/orders/:id\nDM・WebSocket]
        FEEDBACK[⭐️ フィードバック\n/orders/:id/feedback\n評価・傷報告一覧]
        DAMAGE_REPORT[🔍 傷報告\n/orders/:id/damage-report\n写真撮影・bbox描画]
    end

    MY_TOP[👤 マイページ\n/mypage\n評価スコア・プロフィール編集\n出品した商品・購入した商品]

    LIKES[❤️ いいね一覧\n/mypage/likes]
    MY_LISTING[📦 出品中\n/mypage/listing]
    MY_TRADES[💬 取引中\n/mypage/trades]
    HISTORY[👁️ 閲覧履歴\n/mypage/history]

    %% 認証導線
    AUTH_BTN -->|ログインをクリック| LOGIN
    AUTH_BTN -->|サインアップをクリック| SIGNUP
    LOGIN <-->|リンク| SIGNUP
    LOGIN -->|認証成功| HOME
    SIGNUP -->|認証成功| HOME

    %% アバター → ドロップダウン
    AVATAR -->|クリック| DROPDOWN
    DD_MYPAGE --> MY_TOP
    DD_LOGOUT --> LOGIN
    DD_DELETE --> LOGIN

    %% 未認証で保護ルートアクセス
    NAV_LIKES -->|未認証| LOGIN
    NAV_LISTING -->|未認証| LOGIN
    NAV_TRADES -->|未認証| LOGIN
    NAV_HISTORY -->|未認証| LOGIN
    SELL_BTN -->|未認証| LOGIN

    %% サイドバーナビ（認証済み）
    NAV_HOME --> HOME
    NAV_LIKES -->|認証済み| LIKES
    NAV_LISTING -->|認証済み| MY_LISTING
    NAV_TRADES -->|認証済み| MY_TRADES
    NAV_HISTORY -->|認証済み| HISTORY

    %% 商品遷移
    HOME -->|商品カードタップ| PRODUCT_DETAIL
    LIKES -->|商品タップ| PRODUCT_DETAIL
    HISTORY -->|商品タップ| PRODUCT_DETAIL
    MY_LISTING -->|商品タップ| PRODUCT_EDIT
    MY_TOP -->|出品した商品タップ| PRODUCT_EDIT
    MY_TOP -->|購入した商品タップ\npending| TRADE_DETAIL
    MY_TOP -->|購入した商品タップ\ncompleted| PRODUCT_DETAIL
    MY_TRADES -->|取引タップ| TRADE_DETAIL

    %% 購入フロー
    PRODUCT_DETAIL -->|購入するボタン\n未認証→/login| PURCHASE_CONFIRM
    PURCHASE_CONFIRM -->|購入を確定する| PURCHASE_COMPLETE

    %% 出品フロー
    SELL_BTN -->|認証済み| SHOOTING
    SHOOTING -->|5方向撮影完了| PRODUCT_INFO
    PRODUCT_INFO -->|次へ| LISTING_CONFIRM
    LISTING_CONFIRM -->|出品する| LISTING_COMPLETE
    LISTING_COMPLETE -->|商品を見る| PRODUCT_DETAIL
    LISTING_COMPLETE -->|ホームに戻る| HOME

    %% 取引フロー
    TRADE_DETAIL -->|受け取り完了\nbuyerのみ| FEEDBACK
    FEEDBACK -->|傷を報告する\n複数回可| DAMAGE_REPORT
    DAMAGE_REPORT -->|送信\nトースト表示| FEEDBACK
    FEEDBACK -->|フィードバックを送信\n送信後は再送不可| HOME

    %% スタイル
    style LOGIN fill:#6366f1,color:#fff
    style SIGNUP fill:#6366f1,color:#fff
    style HOME fill:#0ea5e9,color:#fff
    style PRODUCT_DETAIL fill:#8b5cf6,color:#fff
    style PRODUCT_EDIT fill:#8b5cf6,color:#fff
    style PURCHASE_CONFIRM fill:#f59e0b,color:#fff
    style PURCHASE_COMPLETE fill:#10b981,color:#fff
    style SHOOTING fill:#ec4899,color:#fff
    style PRODUCT_INFO fill:#ec4899,color:#fff
    style LISTING_CONFIRM fill:#ec4899,color:#fff
    style LISTING_COMPLETE fill:#10b981,color:#fff
    style TRADE_DETAIL fill:#f97316,color:#fff
    style FEEDBACK fill:#f97316,color:#fff
    style DAMAGE_REPORT fill:#ef4444,color:#fff
    style MY_TOP fill:#0ea5e9,color:#fff
    style LIKES fill:#0ea5e9,color:#fff
    style MY_LISTING fill:#0ea5e9,color:#fff
    style MY_TRADES fill:#0ea5e9,color:#fff
    style HISTORY fill:#0ea5e9,color:#fff
    style DD_MYPAGE fill:#64748b,color:#fff
    style DD_LOGOUT fill:#64748b,color:#fff
    style DD_DELETE fill:#64748b,color:#fff
```
