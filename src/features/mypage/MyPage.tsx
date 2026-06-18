import { useReducer, useRef, useState } from 'react'
import { useLoaderData, Link } from 'react-router-dom'
import type { MyPageLoaderData } from './myPageLoader'
import type { OrderStatus, Product } from '../../utils/types'
import { apiFetch, apiUpload } from '../../utils/api'
import Avatar from '../../components/atoms/Avatar'
import styles from './MyPage.module.css'

const PRODUCT_STATUS_LABEL: Record<Product['status'], string> = {
  on_sale: '出品中',
  sold_out: '売却済み',
}

const BUYER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '取引中',
  completed: '受け取り済み',
  cancelled: 'キャンセル',
}

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
  const { user, listings, buyerOrders } = useLoaderData() as MyPageLoaderData

  const [profile, dispatchProfile] = useReducer(profileReducer, {
    displayName: user.display_name,
    isEditing: false,
    loading: false,
    error: null,
  })
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url)
  const [avatarLoading, setAvatarLoading] = useState(false)
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
    try {
      const form = new FormData()
      form.append('avatar', file)
      await apiUpload('/api/me/avatar', form, 'PUT')
      setAvatarUrl(URL.createObjectURL(file))
    } catch {
      // 失敗時はアバターを変更しない
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>マイページ</h1>

      <section className={styles.profileSection}>
        <div className={styles.avatarWrap}>
          <Avatar src={avatarUrl} name={profile.displayName} size="lg" />
          <button
            type="button"
            className={styles.avatarEditBtn}
            disabled={avatarLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarLoading ? '...' : '変更'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className={styles.fileInput}
            onChange={handleAvatarChange}
          />
        </div>

        <div className={styles.profileInfo}>
          <p className={styles.rating}>
            {user.rating_count > 0
              ? `⭐️ ${user.rating_avg.toFixed(1)} (${user.rating_count}件)`
              : '評価なし'}
          </p>
          {profile.isEditing ? (
            <div className={styles.editForm}>
              <input
                className={styles.nameInput}
                value={profile.displayName}
                onChange={e => dispatchProfile({ type: 'change_name', value: e.target.value })}
              />
              {profile.error && <p className={styles.error}>{profile.error}</p>}
              <div className={styles.editActions}>
                <button type="button" onClick={handleNameSave} disabled={profile.loading}>
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => dispatchProfile({ type: 'cancel', originalName: user.display_name })}
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.displayNameRow}>
              <span className={styles.displayName}>{profile.displayName}</span>
              <button type="button" onClick={() => dispatchProfile({ type: 'start_edit' })}>
                編集
              </button>
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>出品した商品</h2>
          <Link to="/mypage/listing" className={styles.seeAll}>
            すべて見る
          </Link>
        </div>
        {listings.items.length === 0 ? (
          <p className={styles.empty}>出品した商品はありません</p>
        ) : (
          <ul className={styles.orderList}>
            {listings.items.map(product => (
              <li key={product.id} className={styles.orderItem}>
                <Link to={`/mypage/products/${product.id}/edit`} className={styles.orderLink}>
                  <img
                    src={product.thumbnail_url}
                    alt={product.title}
                    className={styles.thumbnail}
                  />
                  <div className={styles.orderInfo}>
                    <span className={styles.orderTitle}>{product.title}</span>
                    <span className={styles.orderPrice}>¥{product.price.toLocaleString()}</span>
                  </div>
                  <span className={styles.orderStatus}>{PRODUCT_STATUS_LABEL[product.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>購入した商品</h2>
          <Link to="/mypage/trades" className={styles.seeAll}>
            すべて見る
          </Link>
        </div>
        {buyerOrders.items.length === 0 ? (
          <p className={styles.empty}>購入した商品はありません</p>
        ) : (
          <ul className={styles.orderList}>
            {buyerOrders.items.map(order => (
              <li key={order.id} className={styles.orderItem}>
                <Link
                  to={order.status === 'pending' ? `/orders/${order.id}` : `/products/${order.product.id}`}
                  className={styles.orderLink}
                >
                  <img
                    src={order.product.thumbnail_url}
                    alt={order.product.title}
                    className={styles.thumbnail}
                  />
                  <div className={styles.orderInfo}>
                    <span className={styles.orderTitle}>{order.product.title}</span>
                    <span className={styles.orderPrice}>¥{order.price.toLocaleString()}</span>
                  </div>
                  <span className={styles.orderStatus}>{BUYER_STATUS_LABEL[order.status]}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
