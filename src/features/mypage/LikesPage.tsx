import { useState } from 'react'
import { useLoaderData, Link } from 'react-router-dom'
import type { LikeItem } from '../../utils/types'
import type { LikesLoaderData } from './likesLoader'
import { usePaginatedFetch } from '../../utils/hooks/usePaginatedFetch'
import { apiFetch } from '../../utils/api'
import styles from './LikesPage.module.css'

const STATUS_LABEL: Record<string, string> = {
  on_sale: '出品中',
  sold_out: '売り切れ',
}

export default function LikesPage() {
  const loaderData = useLoaderData() as LikesLoaderData
  const { pagination, sentinelRef, retry } = usePaginatedFetch<LikeItem>(loaderData, '/api/me/likes')

  const [unlikedIds, setUnlikedIds] = useState<Set<string>>(new Set())
  const [unliking, setUnliking] = useState<Set<string>>(new Set())

  async function handleUnlike(productId: string, e: React.MouseEvent) {
    e.preventDefault()
    if (unliking.has(productId)) return
    setUnliking(prev => new Set(prev).add(productId))
    try {
      await apiFetch(`/api/products/${productId}/likes`, { method: 'DELETE' })
      setUnlikedIds(prev => new Set(prev).add(productId))
    } finally {
      setUnliking(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }
  }

  const visibleItems = pagination.items.filter(item => !unlikedIds.has(item.product.id))

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>いいね一覧</h1>
      <p className={styles.count}>{pagination.total - unlikedIds.size}件</p>

      {visibleItems.length === 0 && !pagination.loading ? (
        <p className={styles.empty}>いいねした商品はありません</p>
      ) : (
        <ul className={styles.grid}>
          {visibleItems.map(item => (
            <li key={item.product.id} className={styles.card}>
              <Link to={`/products/${item.product.id}`} className={styles.cardLink}>
                <div className={styles.imageWrap}>
                  <img
                    src={item.product.thumbnail_url}
                    alt={item.product.title}
                    className={styles.image}
                  />
                  <button
                    type="button"
                    className={styles.heartBtn}
                    onClick={e => handleUnlike(item.product.id, e)}
                    disabled={unliking.has(item.product.id)}
                    aria-label="いいねを解除"
                  >
                    ♥
                  </button>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardTitle}>{item.product.title}</p>
                  <p className={styles.cardPrice}>¥{item.product.price.toLocaleString()}</p>
                  <span className={styles.statusBadge} data-status={item.product.status}>
                    {STATUS_LABEL[item.product.status] ?? item.product.status}
                  </span>
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
