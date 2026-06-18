import { useLoaderData, Link } from 'react-router-dom'
import type { LikeItem } from '../../utils/types'
import type { LikesLoaderData } from './likesLoader'
import { usePaginatedFetch } from '../../utils/hooks/usePaginatedFetch'
import styles from './LikesPage.module.css'

export default function LikesPage() {
  const loaderData = useLoaderData() as LikesLoaderData
  const { pagination, sentinelRef, retry } = usePaginatedFetch<LikeItem>(
    loaderData,
    '/api/me/likes',
  )

  return (
    <div className={styles.container}>
      <p className={styles.breadcrumb}>マイページ</p>
      <h1 className={styles.title}>いいね</h1>
      <p className={styles.count}>{pagination.total}件</p>
      {pagination.items.length === 0 && !pagination.loading ? (
        <p className={styles.empty}>いいねした商品はありません</p>
      ) : (
        <ul className={styles.list}>
          {pagination.items.map(item => (
            <li key={item.product.id} className={styles.item}>
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
