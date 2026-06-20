import { useReducer, useRef, useState } from 'react'
import { useLoaderData, Link } from 'react-router-dom'
import type { MyPageLoaderData } from './myPageLoader'
import { apiFetch, apiUpload } from '../../utils/api'
import Avatar from '../../components/atoms/Avatar'
import styles from './MyPage.module.css'

type ProfileState = {
  displayName: string
  isEditing: boolean
  loading: boolean
  error: string | null
}

type ProfileAction =
  | { type: 'start_edit' }
  | { type: 'cancel'; originalName: string }
  | { type: 'change_name'; value: string }
  | { type: 'submit' }
  | { type: 'submit_done' }
  | { type: 'submit_error'; message: string }

function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'start_edit':
      return { ...state, isEditing: true, error: null }
    case 'cancel':
      return { ...state, isEditing: false, displayName: action.originalName, error: null }
    case 'change_name':
      return { ...state, displayName: action.value }
    case 'submit':
      return { ...state, loading: true, error: null }
    case 'submit_done':
      return { ...state, loading: false, isEditing: false }
    case 'submit_error':
      return { ...state, loading: false, error: action.message }
  }
}

export default function MyPage() {
  const { user, listings, recentOrders, likeCount, historyCount } = useLoaderData() as MyPageLoaderData

  const [profile, dispatchProfile] = useReducer(profileReducer, {
    displayName: user.display_name,
    isEditing: false,
    loading: false,
    error: null,
  })
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleNameSave() {
    dispatchProfile({ type: 'submit' })
    try {
      await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ display_name: profile.displayName }),
      })
      dispatchProfile({ type: 'submit_done' })
    } catch {
      dispatchProfile({ type: 'submit_error', message: '更新に失敗しました' })
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    setAvatarError(null)
    try {
      const form = new FormData()
      form.append('avatar', file)
      await apiUpload('/api/me/avatar', form, 'PUT')
      setAvatarUrl(URL.createObjectURL(file))
    } catch {
      setAvatarError('アップロードに失敗しました')
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>マイページ</h1>

      <div className={styles.profileCard}>
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarLoading}
          title="アバターを変更"
        >
          <Avatar src={avatarUrl} name={profile.displayName} size="lg" />
          <span className={styles.avatarOverlay}>
            {avatarLoading ? '...' : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className={styles.fileInput}
          onChange={handleAvatarChange}
        />

        <div className={styles.profileContent}>
          {profile.isEditing ? (
            <div className={styles.editForm}>
              <input
                className={styles.nameInput}
                value={profile.displayName}
                onChange={e => dispatchProfile({ type: 'change_name', value: e.target.value })}
              />
              {profile.error && <p className={styles.error}>{profile.error}</p>}
              {avatarError && <p className={styles.error}>{avatarError}</p>}
              <div className={styles.editActions}>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleNameSave}
                  disabled={profile.loading}
                >
                  保存
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => dispatchProfile({ type: 'cancel', originalName: user.display_name })}
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={styles.displayName}>{profile.displayName}</p>
              <p className={styles.rating}>
                {user.rating_count > 0
                  ? `⭐ ${user.rating_avg.toFixed(1)} (${user.rating_count}件)`
                  : '評価なし'}
              </p>
              <div className={styles.profileActions}>
                <button
                  type="button"
                  className={styles.editProfileBtn}
                  onClick={() => dispatchProfile({ type: 'start_edit' })}
                >
                  プロフィールを編集
                </button>
                <Link to="/mypage/listing" className={styles.listingLink}>
                  出品した商品を見る
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.stats}>
        <Link to="/mypage/listing" className={styles.statCard}>
          <span className={styles.statLabel}>出品中</span>
          <span className={styles.statValue}>{listings.total}</span>
        </Link>
        <Link to="/mypage/trades" className={styles.statCard}>
          <span className={styles.statLabel}>取引中</span>
          <span className={styles.statValue}>{recentOrders.total}</span>
        </Link>
        <Link to="/mypage/likes" className={styles.statCard}>
          <span className={styles.statLabel}>いいね</span>
          <span className={styles.statValue}>{likeCount}</span>
        </Link>
        <Link to="/mypage/history" className={styles.statCard}>
          <span className={styles.statLabel}>閲覧履歴</span>
          <span className={styles.statValue}>{historyCount}</span>
        </Link>
      </div>

      <div className={styles.grid}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>最近の取引</h2>
            <Link to="/mypage/trades" className={styles.seeAll}>すべて見る</Link>
          </div>
          {recentOrders.items.length === 0 ? (
            <p className={styles.empty}>取引はありません</p>
          ) : (
            <ul className={styles.orderList}>
              {recentOrders.items.map(order => (
                <li key={order.id}>
                  <Link to={`/orders/${order.id}`} className={styles.orderCard}>
                    <img
                      src={order.product.thumbnail_url}
                      alt={order.product.title}
                      className={styles.orderThumb}
                    />
                    <div className={styles.orderInfo}>
                      <span className={styles.orderTitle}>{order.product.title}</span>
                      <span className={styles.orderPrice}>¥{order.price.toLocaleString()}</span>
                    </div>
                    <span className={styles.orderStatus} data-status={order.status}>
                      {order.status === 'pending' ? '取引中'
                        : order.status === 'completed' ? '完了'
                        : 'キャンセル'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className={styles.sideColumn}>
          <section>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>お知らせ</h2>
            </div>
            <div className={styles.noticeCard}>
              <p className={styles.noticeTitle}>Loupeへようこそ！</p>
              <p className={styles.noticeText}>
                安全で安心な取引のために、本人確認を完了してください。
              </p>
            </div>
          </section>

          <div className={styles.ctaCard}>
            <p className={styles.ctaTitle}>出品しませんか？</p>
            <p className={styles.ctaText}>使わなくなったアイテムを出品して、流れに届けましょう。</p>
            <Link to="/listing" className={styles.ctaBtn}>出品する</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
