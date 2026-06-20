import { Link, Navigate, useLocation } from 'react-router-dom'
import { useListingContext } from './ListingContext'
import { CONDITION_LABELS } from './listingConstants'
import styles from './CompletePage.module.css'

export default function CompletePage() {
  const location = useLocation()
  const productId = (location.state as { productId?: string } | null)?.productId
  const { state } = useListingContext()

  if (!productId && !state.createdProductId) {
    return <Navigate to="/" replace />
  }

  const resolvedProductId = productId ?? state.createdProductId!
  const title = state.formData?.title
  const price = state.formData?.price
  const imageUrl = state.capturedUrls[0]
  const condition = state.condition

  return (
    <div className={styles.container}>
      <div className={styles.successIcon}>
        <svg viewBox="0 0 60 60" fill="none" className={styles.checkSvg}>
          <circle cx="30" cy="30" r="30" fill="var(--primary)" />
          <path
            d="M18 30l9 9 15-15"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className={styles.successRing} />
      </div>

      <div className={styles.message}>
        <h1 className={styles.heading}>出品が完了しました！</h1>
        <p className={styles.subtext}>商品が正常に出品されました。</p>
      </div>

      {(title ?? imageUrl) && (
        <div className={styles.productCard}>
          {imageUrl && (
            <div className={styles.productImageWrapper}>
              <img src={imageUrl} alt={title ?? '商品'} className={styles.productImage} />
            </div>
          )}
          <div className={styles.productInfo}>
            {title && <p className={styles.productTitle}>{title}</p>}
            {price != null && <p className={styles.productPrice}>¥{price.toLocaleString()}</p>}
          </div>
          {condition && (
            <span className={styles.conditionBadge} data-condition={condition}>
              {CONDITION_LABELS[condition]}
            </span>
          )}
          <span className={styles.statusBadge}>出品中</span>
        </div>
      )}

      <div className={styles.actions}>
        <Link to={`/products/${resolvedProductId}`} className={styles.primaryLink}>
          出品した商品を見る
        </Link>
        <Link to="/mypage" className={styles.secondaryLink}>
          マイページに戻る
        </Link>
        <Link to="/" className={styles.textLink}>
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
