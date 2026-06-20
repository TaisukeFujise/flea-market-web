import { useLoaderData } from 'react-router-dom'
import { Link } from 'react-router-dom'
import type { Order } from '../../utils/types'
import type { TradesLoaderData } from './tradesLoader'
import { usePaginatedFetch } from '../../utils/hooks/usePaginatedFetch'
import { isFeedbackSubmitted } from '../../utils/feedbackState'
import Avatar from '../../components/atoms/Avatar'
import styles from './TradesPage.module.css'

function statusLabel(status: string, hasFeedback: boolean, orderId: string): string {
  if (status === 'pending') return '取引中'
  if (status === 'completed') return (hasFeedback || isFeedbackSubmitted(orderId)) ? '評価済み' : '評価待ち'
  if (status === 'cancelled') return 'キャンセル'
  return status
}

function orderLink(order: { id: string }): string {
  return `/orders/${order.id}`
}

export default function TradesPage() {
  const loaderData = useLoaderData() as TradesLoaderData
  const { pagination, sentinelRef, retry } = usePaginatedFetch<Order>(loaderData, '/api/orders')

  return (
    <div className={styles.container}>
      <p className={styles.breadcrumb}>マイページ</p>
      <h1 className={styles.title}>取引履歴</h1>
      <ul className={styles.list}>
        {pagination.items.map(order => (
          <li key={order.id} className={styles.item}>
            <Link to={orderLink(order)} className={styles.itemLink}>
              <img
                src={order.product.thumbnail_url}
                alt={order.product.title}
                className={styles.thumbnail}
              />
              <div className={styles.info}>
                <div className={styles.titleRow}>
                  <span className={`${styles.badge} ${order.role === 'buyer' ? styles.badgeBuyer : styles.badgeSeller}`}>
                    {order.role === 'buyer' ? '購入' : '出品'}
                  </span>
                  <span className={styles.productTitle}>{order.product.title}</span>
                </div>
                <div className={styles.meta}>
                  <Avatar
                    src={order.counterpart.avatar_url}
                    name={order.counterpart.display_name}
                    size="sm"
                  />
                  <span className={styles.counterpartName}>{order.counterpart.display_name}</span>
                  <span className={styles.date}>
                    · {new Date(order.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <span className={styles.status}>{statusLabel(order.status, order.has_feedback, order.id)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div ref={sentinelRef} className={styles.sentinel}>
        {pagination.loading && <span>読み込み中...</span>}
        {pagination.error && (
          <div className={styles.retryArea}>
            <span>読み込みに失敗しました</span>
            <button type="button" onClick={retry}>再試行</button>
          </div>
        )}
      </div>
    </div>
  )
}
