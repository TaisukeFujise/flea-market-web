import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useLoaderData } from 'react-router-dom'
import { Link } from 'react-router-dom'
import type { Order, OrderRole, Paginated } from '../../utils/types'
import { apiFetch } from '../../utils/api'
import type { TradesLoaderData } from './tradesLoader'
import Avatar from '../../components/atoms/Avatar'
import styles from './TradesPage.module.css'

function statusLabel(status: string, role: OrderRole, hasFeedback: boolean): string {
  if (status === 'completed' && role === 'buyer') {
    return hasFeedback ? '取引完了' : 'フィードバック待ち'
  }
  const map: Record<string, string> = {
    pending_buyer: '受け取り待ち',
    pending_seller: '発送待ち',
    completed_seller: '取引完了',
    cancelled_buyer: 'キャンセル済み',
    cancelled_seller: 'キャンセル済み',
  }
  return map[`${status}_${role}`] ?? status
}

function orderLink(order: { id: string; status: string; role: OrderRole; has_feedback: boolean }): string {
  if (order.status === 'completed' && order.role === 'buyer' && !order.has_feedback) {
    return `/orders/${order.id}/feedback`
  }
  return `/orders/${order.id}`
}

type PaginationState = {
  items: Order[]
  total: number
  offset: number
  loading: boolean
  error: boolean
}

type PaginationAction =
  | { type: 'fetch_start' }
  | { type: 'fetch_done'; items: Order[]; total: number }
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

function initPagination(loaderData: TradesLoaderData): PaginationState {
  return {
    items: loaderData.items,
    total: loaderData.total,
    offset: loaderData.items.length,
    loading: false,
    error: false,
  }
}

export default function TradesPage() {
  const loaderData = useLoaderData() as TradesLoaderData

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
      const data = await apiFetch<Paginated<Order>>(`/api/orders?limit=20&offset=${offsetRef.current}`)
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
      <h1 className={styles.title}>取引中</h1>
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
              <span className={styles.status}>{statusLabel(order.status, order.role, order.has_feedback)}</span>
            </Link>
          </li>
        ))}
      </ul>
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
