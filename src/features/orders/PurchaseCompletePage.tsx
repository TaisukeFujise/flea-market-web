import { Link, Navigate, useLocation } from 'react-router-dom'
import styles from './PurchaseCompletePage.module.css'

type LocationState = {
  orderId: string
  messageRoomId: string
} | null

export default function PurchaseCompletePage() {
  const location = useLocation()
  const state = (location.state as LocationState)

  if (!state?.orderId) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>購入しました</h1>
      <p className={styles.message}>ご購入ありがとうございます。出品者とメッセージで取引を進めてください。</p>
      <div className={styles.actions}>
        <Link to={`/orders/${state.orderId}`} className={styles.primaryLink}>
          取引詳細を見る
        </Link>
        <Link to="/" className={styles.secondaryLink}>
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
