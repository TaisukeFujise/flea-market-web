import { useState } from "react";
import { useLoaderData, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import type { OrderCreateResponse } from "../../utils/types";
import type { PurchaseLoaderData } from "./purchaseLoader";
import styles from "./PurchasePage.module.css";

const CONDITION_LABEL: Record<string, string> = {
  good: "ほぼ新品",
  fair: "目立つ傷少なめ",
  poor: "使用感あり",
};

export default function PurchasePage() {
  const { product } = useLoaderData() as PurchaseLoaderData;
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<OrderCreateResponse>(
        `/api/products/${product.id}/orders`,
        {
          method: "POST",
        },
      );
      navigate("/purchase/complete", {
        state: { orderId: res.id, messageRoomId: res.message_room_id },
        replace: true,
      });
    } catch (err) {
      if (err instanceof Response && err.status === 409) {
        setError("この商品はすでに購入済みです。");
      } else if (err instanceof Response && err.status === 403) {
        setError("自分の出品商品は購入できません。");
      } else {
        setError("購入に失敗しました。もう一度お試しください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.backNav}>
        <Link to={`/products/${product.id}`} className={styles.backLink}>
          ← 商品詳細へ戻る
        </Link>
      </div>

      <h1 className={styles.heading}>購入内容の確認</h1>

      <div className={styles.productCard}>
        {product.images[0] ? (
          <img
            src={product.images[0].url}
            alt={product.title}
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.thumbnail} />
        )}
        <div className={styles.productInfo}>
          <p className={styles.title}>{product.title}</p>
          <p className={styles.seller}>{product.seller.display_name}</p>
          <span className={styles.conditionBadge}>
            {CONDITION_LABEL[product.condition]}
          </span>
        </div>
      </div>

      <section className={styles.priceSection}>
        <div className={styles.priceRow}>
          <span>商品代金</span>
          <span>¥{product.price.toLocaleString()}</span>
        </div>
        <div className={styles.priceRow}>
          <span>送料</span>
          <span>無料</span>
        </div>
        <div className={styles.priceRow}>
          <span>手数料</span>
          <span>無料</span>
        </div>
        <div className={`${styles.priceRow} ${styles.totalRow}`}>
          <span>合計</span>
          <span>¥{product.price.toLocaleString()}</span>
        </div>
      </section>

      {error && <p className={styles.error}>{error}</p>}

      <button
        type="button"
        className={styles.buyButton}
        onClick={() => void handlePurchase()}
        disabled={isSubmitting || product.status === "sold_out"}
      >
        {isSubmitting
          ? "処理中..."
          : `¥${product.price.toLocaleString()} を支払って購入を確定する`}
      </button>
    </div>
  );
}
