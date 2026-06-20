import { Link } from 'react-router-dom'
import styles from './FeedbackCompletePage.module.css'

export default function FeedbackCompletePage() {
  return (
    <div className={styles.page}>
      <p className={styles.icon}>✓</p>
      <h1 className={styles.heading}>フィードバックを送信しました</h1>
      <p className={styles.note}>ご協力ありがとうございます。</p>
      <div className={styles.actions}>
        <Link to="/mypage/trades" className={styles.button}>
          取引中一覧へ
        </Link>
        <Link to="/" className={styles.linkButton}>
          ホームへ戻る
        </Link>
      </div>
    </div>
  )
}
