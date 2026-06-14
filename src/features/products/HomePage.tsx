import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Link, useLoaderData, useSearchParams } from 'react-router-dom'
import type { Product, Paginated } from '../../utils/types'
import { apiFetch } from '../../utils/api'
import type { HomeLoaderData } from './homeLoader'
import styles from './HomePage.module.css'

const CONDITION_LABEL: Record<string, string> = {
  good: 'ほぼ新品',
  fair: '目立つ傷少なめ',
  poor: '使用感あり',
}

const MAX_PRICE = 200000

// ---- Pagination state ----

type PaginationState = { items: Product[]; total: number; offset: number; loading: boolean }
type PaginationAction =
  | { type: 'reset'; items: Product[]; total: number; offset: number }
  | { type: 'fetch_start' }
  | { type: 'fetch_done'; items: Product[]; total: number }

function paginationReducer(state: PaginationState, action: PaginationAction): PaginationState {
  switch (action.type) {
    case 'reset':
      return { items: action.items, total: action.total, offset: action.offset, loading: false }
    case 'fetch_start':
      return { ...state, loading: true }
    case 'fetch_done':
      return {
        items: [...state.items, ...action.items],
        total: action.total,
        offset: state.offset + action.items.length,
        loading: false,
      }
  }
}

function initPagination(loaderData: HomeLoaderData): PaginationState {
  return { items: loaderData.items, total: loaderData.total, offset: loaderData.limit, loading: false }
}

// ---- Component ----

export default function HomePage() {
  const loaderData = useLoaderData() as HomeLoaderData
  const [searchParams, setSearchParams] = useSearchParams()

  const [pagination, dispatch] = useReducer(paginationReducer, loaderData, initPagination)
  // hasMore は派生値
  const hasMore = pagination.offset < pagination.total

  // Filter UI state（URLに永続化しない純粋なUI状態）
  const [checkedConditions, setCheckedConditions] = useState<Set<string>>(() => {
    const fromUrl = searchParams.getAll('condition')
    return fromUrl.length > 0 ? new Set(fromUrl) : new Set(['good', 'fair', 'poor'])
  })
  const [priceRange, setPriceRange] = useState({
    min: parseInt(searchParams.get('min_price') ?? '0'),
    max: parseInt(searchParams.get('max_price') ?? String(MAX_PRICE)),
  })
  // 初回マウント時、URLに子カテゴリが指定されていれば親を展開済みにする
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => {
    const init = new Set<string>()
    const catId = searchParams.get('category_id')
    if (catId) {
      const parent = loaderData.categories.find(c => c.children.some(ch => ch.id === catId))
      if (parent) init.add(parent.id)
    }
    return init
  })

  const sentinelRef = useRef<HTMLDivElement>(null)
  const priceDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedCategory = searchParams.get('category_id') ?? ''
  const selectedSort = searchParams.get('sort') ?? ''

  // ローダーが再実行されたとき（フィルター変更後）にページネーションをリセット
  useEffect(() => {
    dispatch({ type: 'reset', items: loaderData.items, total: loaderData.total, offset: loaderData.limit })
  }, [loaderData])

  const fetchMore = useCallback(async () => {
    if (pagination.loading || !hasMore) return
    dispatch({ type: 'fetch_start' })
    try {
      const qs = new URLSearchParams(searchParams)
      qs.set('limit', '20')
      qs.set('offset', String(pagination.offset))
      const result = await apiFetch<Paginated<Product>>(`/api/products?${qs}`)
      dispatch({ type: 'fetch_done', items: result.items, total: result.total })
    } catch {
      dispatch({ type: 'fetch_done', items: [], total: pagination.total })
    }
  }, [pagination, hasMore, searchParams])

  // 無限スクロール
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchMore() },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, fetchMore])

  function updateFilter(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  function handleConditionChange(condition: string, checked: boolean) {
    const next = new Set(checkedConditions)
    if (checked) next.add(condition)
    else next.delete(condition)
    setCheckedConditions(next)

    setSearchParams(prev => {
      const n = new URLSearchParams(prev)
      n.delete('condition')
      // 全選択（＝フィルターなし）のときはパラメータ不要
      if (next.size < 3) next.forEach(c => n.append('condition', c))
      return n
    })
  }

  function handlePriceChange(key: 'min' | 'max', value: number) {
    setPriceRange(prev => ({ ...prev, [key]: value }))
    if (priceDebounce.current) clearTimeout(priceDebounce.current)
    priceDebounce.current = setTimeout(() => {
      updateFilter(
        key === 'min' ? 'min_price' : 'max_price',
        key === 'min' ? (value > 0 ? String(value) : '') : (value < MAX_PRICE ? String(value) : ''),
      )
    }, 400)
  }

  function toggleParent(parentId: string) {
    setExpandedParents(prev => {
      const next = new Set(prev)
      if (next.has(parentId)) next.delete(parentId)
      else next.add(parentId)
      return next
    })
  }

  function selectCategory(id: string) {
    updateFilter('category_id', selectedCategory === id ? '' : id)
  }

  return (
    <div className={styles.page}>
      <h2>おすすめの商品</h2>
      <p>{pagination.total}件</p>

      <div className={styles.sortBar}>
        {[
          { value: '', label: '新着' },
          { value: 'price_asc', label: '価格が安い' },
          { value: 'price_desc', label: '価格が高い' },
        ].map(s => (
          <button
            key={s.value}
            onClick={() => updateFilter('sort', s.value)}
            className={`${styles.chip} ${selectedSort === s.value ? styles.chipActive : ''}`}
            style={{ borderRadius: '4px' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        {/* Filter panel */}
        <div className={styles.filterPanel}>
          <strong>絞り込み</strong>

          {/* Category */}
          <div className={styles.filterSection}>
            <p><strong>カテゴリ</strong></p>
            <div className={styles.chips}>
              <button
                className={`${styles.chip} ${!selectedCategory ? styles.chipActive : ''}`}
                onClick={() => updateFilter('category_id', '')}
              >
                すべて
              </button>
              {loaderData.categories.map(parent => (
                <button
                  key={parent.id}
                  className={`${styles.chip} ${
                    selectedCategory === parent.id || parent.children.some(ch => ch.id === selectedCategory)
                      ? styles.chipActive
                      : ''
                  }`}
                  onClick={() => { toggleParent(parent.id); selectCategory(parent.id) }}
                >
                  {parent.name}
                </button>
              ))}
            </div>
            {loaderData.categories.map(parent =>
              expandedParents.has(parent.id) && parent.children.length > 0 ? (
                <div key={parent.id} className={styles.childChips}>
                  {parent.children.map(child => (
                    <button
                      key={child.id}
                      className={`${styles.chip} ${styles.chipSmall} ${selectedCategory === child.id ? styles.chipActive : ''}`}
                      onClick={() => selectCategory(child.id)}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              ) : null,
            )}
          </div>

          {/* Condition */}
          <div className={styles.filterSection}>
            <p><strong>状態</strong></p>
            {(['good', 'fair', 'poor'] as const).map(c => (
              <label key={c} className={styles.conditionLabel}>
                <input
                  type="checkbox"
                  checked={checkedConditions.has(c)}
                  onChange={e => handleConditionChange(c, e.target.checked)}
                />
                {CONDITION_LABEL[c]}
              </label>
            ))}
          </div>

          {/* Price */}
          <div className={styles.filterSection}>
            <div className={styles.priceRow}>
              <span>下限価格</span>
              <span>{priceRange.min > 0 ? `¥${priceRange.min.toLocaleString()}` : '下限なし'}</span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_PRICE}
              step={1000}
              value={priceRange.min}
              onChange={e => handlePriceChange('min', Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.priceRow} style={{ marginTop: '8px' }}>
              <span>上限価格</span>
              <span>{priceRange.max < MAX_PRICE ? `¥${priceRange.max.toLocaleString()}` : '上限なし'}</span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_PRICE}
              step={1000}
              value={priceRange.max}
              onChange={e => handlePriceChange('max', Number(e.target.value))}
              className={styles.slider}
            />
          </div>
        </div>

        {/* Product grid */}
        <div className={styles.grid}>
          {pagination.items.map(product => (
            <Link key={product.id} to={`/products/${product.id}`} className={styles.card}>
              <img src={product.thumbnail_url} alt={product.title} />
              <div className={styles.cardBody}>
                <p>{product.title}</p>
                <div className={styles.cardFooter}>
                  <span>¥{product.price.toLocaleString()}</span>
                  <span>{CONDITION_LABEL[product.condition]}</span>
                </div>
                {product.damage_count !== undefined && <small>傷 {product.damage_count}件</small>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div ref={sentinelRef} className={styles.sentinel}>
        {pagination.loading && <span>読み込み中...</span>}
        {!hasMore && pagination.items.length > 0 && <span>すべて表示しました</span>}
      </div>
    </div>
  )
}
