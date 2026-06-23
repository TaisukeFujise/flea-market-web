import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const Illustration404 = () => (
  <div className={styles.illus404Wrapper}>
    <div className={styles.errorCode}>404</div>
    <svg width="220" height="118" viewBox="0 0 220 118" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="108" rx="100" ry="18" fill="#ECEEF8"/>
      <ellipse cx="26" cy="54" rx="20" ry="13" fill="#DDE0F5"/>
      <ellipse cx="42" cy="44" rx="17" ry="11" fill="#DDE0F5"/>
      <ellipse cx="56" cy="51" rx="15" ry="11" fill="#DDE0F5"/>
      <ellipse cx="164" cy="51" rx="15" ry="11" fill="#DDE0F5"/>
      <ellipse cx="178" cy="44" rx="17" ry="11" fill="#DDE0F5"/>
      <ellipse cx="194" cy="54" rx="20" ry="13" fill="#DDE0F5"/>
      <rect x="106" y="72" width="8" height="37" rx="2" fill="#A8AAEC"/>
      <rect x="75" y="26" width="70" height="50" rx="7" fill="#C0C2F0"/>
      <polygon points="110,33 93,55 127,55" fill="white" opacity="0.55"/>
      <text x="110" y="52" textAnchor="middle" fontSize="13" fontWeight="700" fill="#6C6FDC" fontFamily="sans-serif">!</text>
      <ellipse cx="46" cy="108" rx="30" ry="10" fill="#C0C2F0"/>
      <ellipse cx="174" cy="108" rx="30" ry="10" fill="#C0C2F0"/>
    </svg>
  </div>
)

export default function NotFoundPage() {
  return (
    <div className={styles.container}>
      <Illustration404 />
      <h1 className={styles.title}>ページが見つかりません</h1>
      <p className={styles.subtitle}>
        お探しのページは存在しないか、<br />URLが変更された可能性があります。
      </p>
      <div className={styles.actions}>
        <Link to="/" className={styles.primaryBtn}>
          <IconHome /> ホームに戻る
        </Link>
      </div>
    </div>
  )
}
