import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useLoaderData, Link } from 'react-router-dom'
import type { ViewingHistoryItem, Paginated } from '../../utils/types'
import { apiFetch } from '../../utils/api'
import type { HistoryLoaderData } from './historyLoader'
import styles from './HistoryPage.module.css'

type PaginationState = {
  items: ViewingHistoryItem[]
  total: number
  offset: number
  loading: boolean
  error: boolean
}

type PaginationAction =
  | { type: 'fetch_start' }
  | { type: 'fetch_done'; items: ViewingHistoryItem[]; total: number }
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

function initPagination(loaderData: HistoryLoaderData): PaginationState {
  return {
    items: loaderData.items,
    total: loaderData.total,
    offset: loaderData.items.length,
    loading: false,
    error: false,
  }
}

export default function HistoryPage() {
  const loaderData = useLoaderData() as HistoryLoaderData

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
      const data = await apiFetch<Paginated<ViewingHistoryItem>>(`/api/me/viewing-history?limit=20&offset=${offsetRef.current}`)
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
            <button type="button" onClick={() => dispatch({ type: 'retry' })}>再試行</button>
          </div>
        )}
      </div>
    </div>
  )
}
