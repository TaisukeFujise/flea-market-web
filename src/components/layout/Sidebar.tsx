import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../utils/hooks/useAuth'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { icon: '🏠', label: 'ホーム', path: '/', requiresAuth: false },
  { icon: '♡', label: 'いいね', path: '/mypage/likes', requiresAuth: true },
  { icon: '📦', label: '出品中', path: '/mypage/listing', requiresAuth: true },
  { icon: '💬', label: '取引中', path: '/mypage/trades', requiresAuth: true },
  { icon: '👁️', label: '閲覧履歴', path: '/mypage/history', requiresAuth: true },
]

export default function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleClick(path: string, requiresAuth: boolean) {
    if (requiresAuth && !user) {
      navigate('/login')
    } else {
      navigate(path)
    }
  }

  return (
    <aside className={styles.sidebar}>
      <nav>
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
            onClick={() => handleClick(item.path, item.requiresAuth)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
