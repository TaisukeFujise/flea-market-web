import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useLoaderData, Link } from 'react-router-dom'
import type { Product, Paginated } from '../../utils/types'
import { apiFetch } from '../../utils/api'
import type { MyListingLoaderData } from './myListingLoader'
import styles from './MyListingPage.module.css'

const STATUS_LABEL: Record<'on_sale' | 'sold_out', string> = {
  on_sale: '出品中',
  sold_out: '売却済み',
}

type PaginationState = {
  items: Product[]
  total: number
  offset: number
  loading: boolean
  error: boolean
}

type PaginationAction =
  | { type: 'fetch_start' }
  | { type: 'fetch_done'; items: Product[]; total: number }
  | { type: 'fetch_error' }
  | { type: 'retry' }

function paginationReducer(state: PaginationState, action: PaginationAction): PaginationState {
  switch (action.type) {
    case 'fetch_start':
      return { ...state, loading: true, error: false }
    case 'fetch_done':
      return {
        items: [...state.items, ...action.items],
        total: action.total,
        offset: state.offset + action.items.length,
        loading: false,
        error: false,
      }
    case 'fetch_error':
      return { ...state, loading: false, error: true }
    case 'retry':
      return { ...state, error: false }
  }
}

function initPagination(loaderData: MyListingLoaderData): PaginationState {
  return {
    items: loaderData.items,
    total: loaderData.total,
    offset: loaderData.items.length,
    loading: false,
    error: false,
  }
}

export default function MyListingPage() {
  const loaderData = useLoaderData() as MyListingLoaderData

  const [pagination, dispatch] = useReducer(paginationReducer, loaderData, initPagination)
  const hasMore = pagination.offset < pagination.total && !pagination.error

  const sentinelRef = useRef<HTMLDivElement>(null)
  const isFetchingRef = useRef(false)
  const offsetRef = useRef(pagination.offset)
  useEffect(() => {
    offsetRef.current = pagination.offset
  }, [pagination.offset])

  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return
    isFetchingRef.current = true
    dispatch({ type: 'fetch_start' })
    try {
      const data = await apiFetch<Paginated<Product>>(`/api/me/listings?limit=20&offset=${offsetRef.current}`)
      dispatch({ type: 'fetch_done', items: data.items, total: data.total })
    } catch {
      dispatch({ type: 'fetch_error' })
    } finally {
      isFetchingRef.current = false
    }
  }, [hasMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) void fetchMore() },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, fetchMore])

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
                <span className={styles.status}>{STATUS_LABEL[product.status]}</span>
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
            <button type="button" onClick={() => dispatch({ type: 'retry' })}>再試行</button>
          </div>
        )}
      </div>
    </div>
  )
}
