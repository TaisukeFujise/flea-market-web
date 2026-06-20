import { useLoaderData, Link } from 'react-router-dom'
import type { ViewingHistoryItem } from '../../utils/types'
import type { HistoryLoaderData } from './historyLoader'
import { usePaginatedFetch } from '../../utils/hooks/usePaginatedFetch'
import styles from './HistoryPage.module.css'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'たった今'
  if (mins < 60) return `${mins}分前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  return `${days}日前`
}

export default function HistoryPage() {
  const loaderData = useLoaderData() as HistoryLoaderData
  const { pagination, sentinelRef, retry } = usePaginatedFetch<ViewingHistoryItem>(
    loaderData,
    '/api/me/viewing-history',
  )

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>閲覧履歴一覧</h1>
      <p className={styles.count}>{pagination.total}件</p>

      {pagination.items.length === 0 && !pagination.loading ? (
        <p className={styles.empty}>閲覧履歴はありません</p>
      ) : (
        <ul className={styles.list}>
          {pagination.items.map(item => (
            <li key={`${item.product.id}-${item.viewed_at}`} className={styles.card}>
              <Link to={`/products/${item.product.id}`} className={styles.cardLink}>
                <img
                  src={item.product.thumbnail_url}
                  alt={item.product.title}
                  className={styles.thumbnail}
                />
                <div className={styles.info}>
                  <span className={styles.productTitle}>{item.product.title}</span>
                  <span className={styles.price}>¥{item.product.price.toLocaleString()}</span>
                </div>
                <span className={styles.time}>{relativeTime(item.viewed_at)}</span>
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
        閲覧履歴は最大30件まで保存されます。
      </p>
    </div>
  )
}
