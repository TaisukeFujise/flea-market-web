import { useLoaderData, Link } from 'react-router-dom'
import type { ViewingHistoryItem } from '../../utils/types'
import type { HistoryLoaderData } from './historyLoader'
import { usePaginatedFetch } from '../../utils/hooks/usePaginatedFetch'
import styles from './HistoryPage.module.css'

export default function HistoryPage() {
  const loaderData = useLoaderData() as HistoryLoaderData
  const { pagination, sentinelRef, retry } = usePaginatedFetch<ViewingHistoryItem>(
    loaderData,
    '/api/me/viewing-history',
  )

  return (
    <div className={styles.container}>
      <p className={styles.breadcrumb}>マイページ</p>
      <h1 className={styles.title}>閲覧履歴</h1>
      <p className={styles.count}>{pagination.total}件</p>
      {pagination.items.length === 0 && !pagination.loading ? (
        <p className={styles.empty}>閲覧履歴はありません</p>
      ) : (
        <ul className={styles.list}>
          {pagination.items.map(item => (
            <li key={`${item.product.id}-${item.viewed_at}`} className={styles.item}>
              <Link to={`/products/${item.product.id}`} className={styles.itemLink}>
                <img
                  src={item.product.thumbnail_url}
                  alt={item.product.title}
                  className={styles.thumbnail}
                />
                <div className={styles.info}>
                  <span className={styles.productTitle}>{item.product.title}</span>
                  <span className={styles.price}>¥{item.product.price.toLocaleString()}</span>
                </div>
                <span className={styles.date}>
                  {new Date(item.viewed_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                </span>
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
    </div>
  )
}
