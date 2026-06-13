import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../utils/hooks/useAuth'
import { apiFetch } from '../../utils/api'
import ConfirmModal from '../atoms/ConfirmModal'
import styles from './Header.module.css'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
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

  async function handleDeleteAccount() {
    try {
      await apiFetch('/api/me', { method: 'DELETE' })
      await signOut(auth)
      localStorage.removeItem('token')
      navigate('/login')
    } catch {
      setDeleteError('削除に失敗しました。もう一度お試しください。')
    }
  }

  const avatarFallback = user?.displayName?.[0] ?? user?.email?.[0] ?? '?'

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <img src="/Loupe-Cormorant.svg" alt="Loupe" className={styles.logoImage} />
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
                <button
                  className={styles.deleteButton}
                  onClick={() => { setDeleteModalOpen(true); setDropdownOpen(false) }}
                >
                  アカウント削除
                </button>
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

      {deleteModalOpen && (
        <ConfirmModal
          title="アカウントを削除しますか？"
          description={deleteError ?? '削除すると出品中の商品や取引履歴など、すべてのデータが失われます。この操作は取り消せません。'}
          confirmLabel="削除する"
          danger
          onConfirm={handleDeleteAccount}
          onCancel={() => { setDeleteModalOpen(false); setDeleteError(null) }}
        />
      )}
    </header>
  )
}
