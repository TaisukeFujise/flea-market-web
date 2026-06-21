import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useAuth } from '../../utils/hooks/useAuth'
import { apiFetch } from '../../utils/api'
import Avatar from '../atoms/Avatar'
import Button from '../atoms/Button'
import ConfirmModal from '../atoms/ConfirmModal'
import styles from './Header.module.css'

const IconHeart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchInputRef.current?.value.trim() ?? ''
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

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

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <span className={styles.searchIcon}><IconSearch /></span>
        <input
          ref={searchInputRef}
          key={searchParams.get('q') ?? ''}
          type="search"
          placeholder="商品を検索..."
          defaultValue={searchParams.get('q') ?? ''}
          className={styles.searchInput}
        />
      </form>

      <div className={styles.right}>
        {user && (
          <Link to="/mypage/likes" className={styles.likeLink}>
            <IconHeart />
            <span>いいね</span>
          </Link>
        )}
        <button className={styles.listingBtn} onClick={() => navigate('/listing/upload')}>出品する</button>
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
            <Button variant="secondary" size="lg" onClick={() => navigate('/login')}>ログイン</Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/signup')}>サインアップ</Button>
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
