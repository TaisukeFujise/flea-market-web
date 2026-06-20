import { Link, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { label: 'マイページトップ', path: '/mypage' },
  { label: 'いいね一覧', path: '/mypage/likes' },
  { label: '出品中一覧', path: '/mypage/listing' },
  { label: '取引中一覧', path: '/mypage/trades' },
  { label: '取引履歴一覧', path: '/mypage/history' },
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
        {NAV_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${activePath === item.path ? styles.active : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
