import { Link, Navigate, useLocation } from 'react-router-dom'
import styles from './PurchaseCompletePage.module.css'

type LocationState = {
  orderId: string
  messageRoomId: string
} | null

const IconCheck = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function PurchaseCompletePage() {
  const location = useLocation()
  const state = (location.state as LocationState)

  if (!state?.orderId) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <IconCheck />
        </div>
        <h1 className={styles.heading}>購入が完了しました</h1>
        <p className={styles.message}>
          ご購入ありがとうございます。<br />
          出品者とメッセージで取引を進めてください。
        </p>
        <div className={styles.actions}>
          <Link to={`/orders/${state.orderId}`} className={styles.primaryLink}>
            取引詳細を見る
          </Link>
          <Link to="/" className={styles.secondaryLink}>
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
