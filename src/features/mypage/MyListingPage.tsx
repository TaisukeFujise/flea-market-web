import { useLoaderData, Link } from 'react-router-dom'
import type { Product } from '../../utils/types'
import type { MyListingLoaderData } from './myListingLoader'
import { usePaginatedFetch } from '../../utils/hooks/usePaginatedFetch'
import { PRODUCT_STATUS_LABEL } from '../../utils/productStatus'
import styles from './MyListingPage.module.css'

const FLOW_STEPS = [
  '購入される',
  '商品を発送する',
  '購入者安全評価期間',
  '売上が確定します',
] as const

export default function MyListingPage() {
  const loaderData = useLoaderData() as MyListingLoaderData
  const { pagination, sentinelRef, retry } = usePaginatedFetch<Product>(
    loaderData,
    '/api/me/listings',
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>出品一覧</h1>
          <p className={styles.count}>{pagination.total}件</p>
        </div>
        <Link to="/listing" className={styles.addBtn}>+ 出品する</Link>
      </div>

      {pagination.items.length === 0 && !pagination.loading ? (
        <p className={styles.empty}>出品した商品はありません</p>
      ) : (
        <ul className={styles.list}>
          {pagination.items.map(product => (
            <li key={product.id} className={styles.card}>
              <Link to={`/mypage/products/${product.id}/edit`} className={styles.cardLink}>
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className={styles.thumbnail}
                />
                <div className={styles.info}>
                  <span className={styles.productTitle}>{product.title}</span>
                  <span className={styles.price}>¥{product.price.toLocaleString()}</span>
                  <span className={styles.date}>
                    出品日: {new Date(product.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <span className={styles.statusBadge} data-status={product.status}>
                  {PRODUCT_STATUS_LABEL[product.status]}
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

      <div className={styles.flowBar}>
        {FLOW_STEPS.map((step, i) => (
          <div key={step} className={styles.flowStep}>
            <span className={styles.flowNum}>{i + 1}</span>
            <span className={styles.flowLabel}>{step}</span>
            {i < FLOW_STEPS.length - 1 && (
              <span className={styles.flowArrow}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
