import { useLoaderData, Link } from 'react-router-dom'
import type { Product } from '../../utils/types'
import type { MyListingLoaderData } from './myListingLoader'
import { usePaginatedFetch } from '../../utils/hooks/usePaginatedFetch'
import { PRODUCT_STATUS_LABEL } from '../../utils/productStatus'
import styles from './MyListingPage.module.css'

export default function MyListingPage() {
  const loaderData = useLoaderData() as MyListingLoaderData
  const { pagination, sentinelRef, retry } = usePaginatedFetch<Product>(
    loaderData,
    '/api/me/listings',
  )

  return (
    <div className={styles.container}>
      <p className={styles.breadcrumb}>マイページ</p>
      <h1 className={styles.title}>出品中</h1>
      <p className={styles.count}>{pagination.total}件</p>
      {pagination.items.length === 0 && !pagination.loading ? (
        <p className={styles.empty}>出品した商品はありません</p>
      ) : (
        <ul className={styles.list}>
          {pagination.items.map(product => (
            <li key={product.id} className={styles.item}>
              <Link to={`/mypage/products/${product.id}/edit`} className={styles.itemLink}>
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className={styles.thumbnail}
                />
                <div className={styles.info}>
                  <span className={styles.productTitle}>{product.title}</span>
                  <span className={styles.price}>¥{product.price.toLocaleString()}</span>
                </div>
                <span className={styles.status}>{PRODUCT_STATUS_LABEL[product.status]}</span>
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
