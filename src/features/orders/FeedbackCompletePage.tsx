import { Link } from 'react-router-dom'
import styles from './FeedbackCompletePage.module.css'

export default function FeedbackCompletePage() {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className={styles.heading}>完了</h1>
      <p className={styles.title}>フィードバックを送信しました</p>
      <p className={styles.note}>ご協力ありがとうございます。</p>
      <div className={styles.actions}>
        <Link to="/mypage/trades" className={styles.primaryButton}>
          取引中一覧へ &gt;
        </Link>
        <Link to="/" className={styles.linkButton}>
          ホームへ戻る
        </Link>
      </div>
    </div>
  )
}
