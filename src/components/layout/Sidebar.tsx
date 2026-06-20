import { Link, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)

const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)

const IconTag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)

const IconArrows = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
)

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const NAV_ITEMS = [
  { label: 'マイページトップ', path: '/mypage', Icon: IconHome },
  { label: 'いいね一覧', path: '/mypage/likes', Icon: IconHeart },
  { label: '出品中一覧', path: '/mypage/listing', Icon: IconTag },
  { label: '取引中一覧', path: '/mypage/trades', Icon: IconArrows },
  { label: '閲覧履歴一覧', path: '/mypage/history', Icon: IconClock },
] as const

function getActivePath(pathname: string): string {
  if (pathname === '/mypage') return '/mypage'
  if (pathname.startsWith('/mypage/likes')) return '/mypage/likes'
  if (pathname.startsWith('/mypage/listing')) return '/mypage/listing'
  if (pathname.startsWith('/mypage/trades') || pathname.startsWith('/orders/')) return '/mypage/trades'
  if (pathname.startsWith('/mypage/history')) return '/mypage/history'
  return ''
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const activePath = getActivePath(pathname)

  return (
    <aside className={styles.sidebar}>
      <p className={styles.sectionLabel}>マイページ</p>
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ label, path, Icon }) => (
          <Link
            key={path}
            to={path}
            className={`${styles.navItem} ${activePath === path ? styles.active : ''}`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
