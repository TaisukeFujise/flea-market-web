import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import styles from './ErrorPage.module.css'

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
)

const IconWifi = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114.08 0"/>
    <path d="M1.42 9a16 16 0 0121.16 0"/>
    <path d="M8.53 16.11a6 6 0 016.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
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

const IllustrationGeneric = () => (
  <svg width="220" height="168" viewBox="0 0 220 168" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="55" r="26" fill="#ECEEF8"/>
    <circle cx="30" cy="55" r="18" fill="#F7F7FD"/>
    <circle cx="190" cy="60" r="22" fill="#ECEEF8"/>
    <circle cx="190" cy="60" r="15" fill="#F7F7FD"/>
    <rect x="50" y="28" width="120" height="92" rx="10" fill="#DDE0F5"/>
    <rect x="50" y="28" width="120" height="26" rx="10" fill="#C0C2F0"/>
    <rect x="50" y="42" width="120" height="12" fill="#C0C2F0"/>
    <circle cx="65" cy="41" r="4" fill="white" opacity="0.65"/>
    <circle cx="77" cy="41" r="4" fill="white" opacity="0.65"/>
    <circle cx="89" cy="41" r="4" fill="white" opacity="0.65"/>
    <circle cx="110" cy="92" r="26" fill="#ECEEF8"/>
    <circle cx="101" cy="86" r="3.5" fill="#8888C0"/>
    <circle cx="119" cy="86" r="3.5" fill="#8888C0"/>
    <path d="M101 101 Q110 95 119 101" stroke="#8888C0" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="146" cy="110" r="14" fill="#F5A623"/>
    <rect x="144" y="101" width="4" height="8" rx="2" fill="white"/>
    <circle cx="146" cy="113" r="2" fill="white"/>
  </svg>
)

const IllustrationNetwork = () => (
  <svg width="180" height="148" viewBox="0 0 180 148" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="90" cy="140" rx="78" ry="14" fill="#ECEEF8"/>
    <path d="M16 70 Q90 8 164 70" stroke="#DDE0F5" strokeWidth="14" strokeLinecap="round" fill="none"/>
    <path d="M36 84 Q90 36 144 84" stroke="#C0C2F0" strokeWidth="12" strokeLinecap="round" fill="none"/>
    <path d="M56 98 Q90 62 124 98" stroke="#A8AAEC" strokeWidth="10" strokeLinecap="round" fill="none"/>
    <circle cx="90" cy="116" r="10" fill="#6C6FDC"/>
    <circle cx="128" cy="102" r="18" fill="#FF6B6B"/>
    <line x1="119" y1="93" x2="137" y2="111" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <line x1="137" y1="93" x2="119" y2="111" stroke="white" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

type ErrorKind = '404' | 'network' | 'generic'

function classifyError(error: unknown): ErrorKind {
  if (isRouteErrorResponse(error) && error.status === 404) return '404'
  if (error instanceof TypeError) return 'network'
  return 'generic'
}

export default function ErrorPage() {
  const error = useRouteError()
  const kind = classifyError(error)

  if (kind === '404') {
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

  if (kind === 'network') {
    return (
      <div className={styles.container}>
        <IllustrationNetwork />
        <h1 className={styles.title}>接続できませんでした</h1>
        <p className={styles.subtitle}>
          インターネット接続を確認して、<br />しばらくしてから再度お試しください。
        </p>
        <div className={styles.actions}>
          <button onClick={() => window.location.reload()} className={styles.primaryBtn}>
            <IconRefresh /> 再読み込み
          </button>
          <Link to="/" className={styles.secondaryBtn}>
            <IconHome /> ホームに戻る
          </Link>
        </div>
        <div className={styles.checklist}>
          <div className={styles.checklistHeader}>
            <IconWifi />
            <span>確認してみましょう</span>
          </div>
          <ul className={styles.checklistItems}>
            <li>Wi-Fiやモバイルデータがオンになっているか確認してください</li>
            <li>機内モードがオンになっていないか確認してください</li>
            <li>しばらく時間をおいてから再度お試しください</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <IllustrationGeneric />
      <h1 className={styles.title}>エラーが発生しました</h1>
      <p className={styles.subtitle}>
        予期しないエラーが発生しました。<br />しばらくしてから再度お試しください。
      </p>
      <div className={styles.actions}>
        <Link to="/" className={styles.primaryBtn}>
          <IconHome /> ホームに戻る
        </Link>
        <button onClick={() => window.location.reload()} className={styles.secondaryBtn}>
          <IconRefresh /> 再読み込み
        </button>
      </div>
    </div>
  )
}
