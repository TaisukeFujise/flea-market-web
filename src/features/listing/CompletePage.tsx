import { Link, Navigate, useLocation } from 'react-router-dom'
import styles from './CompletePage.module.css'

export default function CompletePage() {
  const location = useLocation()
  const productId = (location.state as { productId?: string } | null)?.productId

  if (!productId) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>出品しました</h1>
      <p className={styles.message}>商品が正常に出品されました。</p>
      <div className={styles.actions}>
        <Link to={`/products/${productId}`} className={styles.primaryLink}>
          商品を見る
        </Link>
        <Link to="/" className={styles.secondaryLink}>
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
