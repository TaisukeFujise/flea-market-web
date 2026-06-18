import { useCallback, useEffect, useReducer, useRef } from 'react'
import { apiFetch } from '../api'
import type { Paginated } from '../types'

type PaginationState<T> = {
  items: T[]
  total: number
  offset: number
  loading: boolean
  error: boolean
}

type PaginationAction<T> =
  | { type: 'fetch_start' }
  | { type: 'fetch_done'; items: T[]; total: number }
  | { type: 'fetch_error' }
  | { type: 'retry' }

export function usePaginatedFetch<T>(
  initialData: { items: T[]; total: number },
  basePath: string,
) {
  const [pagination, dispatch] = useReducer(
    (state: PaginationState<T>, action: PaginationAction<T>): PaginationState<T> => {
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
    },
    {
      items: initialData.items,
      total: initialData.total,
      offset: initialData.items.length,
      loading: false,
      error: false,
    },
  )

  const hasMore = pagination.offset < pagination.total && !pagination.error
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isFetchingRef = useRef(false)

  const fetchMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return
    isFetchingRef.current = true
    dispatch({ type: 'fetch_start' })
    try {
      const data = await apiFetch<Paginated<T>>(`${basePath}?limit=20&offset=${pagination.offset}`)
      dispatch({ type: 'fetch_done', items: data.items, total: data.total })
    } catch {
      dispatch({ type: 'fetch_error' })
    } finally {
      isFetchingRef.current = false
    }
  }, [hasMore, basePath, pagination.offset])

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

  return {
    pagination,
    sentinelRef,
    retry: () => dispatch({ type: 'retry' }),
  }
}
