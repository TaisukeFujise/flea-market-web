import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../utils/hooks/useAuth'
import { apiFetch } from '../../utils/api'
import Avatar from '../atoms/Avatar'
import Button from '../atoms/Button'
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

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <img src="/Loupe-Cormorant.svg" alt="Loupe" className={styles.logoImage} />
      </Link>
      <div className={styles.right}>
        <Button onClick={() => navigate('/listing')} size="sm">出品する</Button>
        {user ? (
          <div className={styles.avatarWrapper} ref={dropdownRef}>
            <button className={styles.avatarButton} onClick={() => setDropdownOpen(prev => !prev)}>
              <Avatar src={user.photoURL} name={user.displayName ?? user.email} size="md" />
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
            <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>ログイン</Button>
            <Button size="sm" onClick={() => navigate('/signup')}>サインアップ</Button>
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
