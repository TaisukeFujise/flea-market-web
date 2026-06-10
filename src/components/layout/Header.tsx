import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../utils/auth'
import styles from './Header.module.css'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await signOut(auth)
    localStorage.removeItem('token')
    setDropdownOpen(false)
    navigate('/login')
  }

  const avatarFallback = user?.displayName?.[0] ?? user?.email?.[0] ?? '?'

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <img src="/brand-concept-logo.png" alt="Loupe" className={styles.logoImage} />
      </Link>
      <div className={styles.right}>
        <button onClick={() => navigate('/listing')} className={styles.sellButton}>出品する</button>
        {user ? (
          <div className={styles.avatarWrapper} ref={dropdownRef}>
            <button className={styles.avatarButton} onClick={() => setDropdownOpen(prev => !prev)}>
              {user.photoURL
                ? <img src={user.photoURL} alt={user.displayName ?? ''} className={styles.avatar} />
                : <span className={styles.avatarFallback}>{avatarFallback.toUpperCase()}</span>
              }
            </button>
            {dropdownOpen && (
              <div className={styles.dropdown}>
                <button onClick={() => { navigate('/mypage'); setDropdownOpen(false) }}>マイページ</button>
                <button onClick={handleLogout}>ログアウト</button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.authButtons}>
            <button onClick={() => navigate('/login')}>ログイン</button>
            <button onClick={() => navigate('/signup')}>サインアップ</button>
          </div>
        )}
      </div>
    </header>
  )
}
