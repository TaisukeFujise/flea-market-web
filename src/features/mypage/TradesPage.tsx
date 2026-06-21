import { useState } from 'react'
import { useLoaderData, Link } from 'react-router-dom'
import type { Order } from '../../utils/types'
import type { TradesLoaderData } from './tradesLoader'
import { usePaginatedFetch } from '../../utils/hooks/usePaginatedFetch'
import { isFeedbackSubmitted } from '../../utils/feedbackState'
import styles from './TradesPage.module.css'

type TabKey = 'all' | 'pending' | 'awaiting' | 'completed' | 'cancelled'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'pending', label: '取引中' },
  { key: 'awaiting', label: '評価待ち' },
  { key: 'completed', label: '完了' },
  { key: 'cancelled', label: 'キャンセル' },
]

function hasFeedback(order: Order): boolean {
  return order.has_feedback || isFeedbackSubmitted(order.id)
}

function statusLabel(order: Order): string {
  if (order.status === 'pending') return '取引中'
  if (order.status === 'completed') return hasFeedback(order) ? '評価済み' : '評価待ち'
  return 'キャンセル'
}

function statusKey(order: Order): string {
  if (order.status === 'pending') return 'pending'
  if (order.status === 'completed') return hasFeedback(order) ? 'completed' : 'awaiting'
  return 'cancelled'
}

export default function TradesPage() {
  const loaderData = useLoaderData() as TradesLoaderData
  const { pagination, sentinelRef, retry } = usePaginatedFetch<Order>(loaderData, '/api/orders')
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const filtered =
    activeTab === 'all'
      ? pagination.items
      : pagination.items.filter(o => statusKey(o) === activeTab)

  function tabCount(key: TabKey): number {
    if (key === 'all') return pagination.items.length
    return pagination.items.filter(o => statusKey(o) === key).length
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>取引中一覧</h1>
      <p className={styles.count}>{pagination.total}件</p>

      <div className={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className={styles.tabBadge}>{tabCount(tab.key)}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && !pagination.loading ? (
        <p className={styles.empty}>取引はありません</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map(order => (
            <li key={order.id}>
              <Link to={`/orders/${order.id}`} className={styles.card}>
                <img
                  src={order.product.thumbnail_url}
                  alt={order.product.title}
                  className={styles.thumbnail}
                />
                <div className={styles.info}>
                  <div className={styles.titleRow}>
                    <span
                      className={`${styles.roleBadge} ${order.role === 'buyer' ? styles.buyer : styles.seller}`}
                    >
                      {order.role === 'buyer' ? '購入' : '出品'}
                    </span>
                    <span className={styles.productTitle}>{order.product.title}</span>
                  </div>
                  <span className={styles.price}>¥{order.price.toLocaleString()}</span>
                  <div className={styles.meta}>
                    <span>取引ID: {order.id.slice(0, 12)}</span>
                    <span>購入日: {new Date(order.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
                <div className={styles.cardRight}>
                  <span className={styles.statusBadge} data-status={statusKey(order)}>
                    {statusLabel(order)}
                  </span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={styles.chevron}
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div ref={sentinelRef} className={styles.sentinel}>
        {pagination.loading && <span>読み込み中...</span>}
        {pagination.error && (
          <div className={styles.retryArea}>
            <span>読み込みに失敗しました</span>
            <button type="button" onClick={retry}>再試行</button>
          </div>
        )}
      </div>

      <p className={styles.note}>
        <span className={styles.noteIcon}>ⓘ</span>
        取引が完了すると、出品者・購入者相互評価ができます。
      </p>
    </div>
  )
}
