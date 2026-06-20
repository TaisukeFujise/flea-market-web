import { useState } from 'react'
import { useNavigate, useRouteLoaderData, useSearchParams } from 'react-router-dom'
import type { LayoutLoaderData } from './layoutLoader'
import styles from './CategoryNav.module.css'

const HOME_FILTER_KEYS = ['q', 'min_price', 'max_price', 'sort'] as const

export default function CategoryNav() {
  const { categories } = useRouteLoaderData('root') as LayoutLoaderData
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category_id') ?? ''

  function navigateWithCategory(catId: string) {
    const next = new URLSearchParams()
    for (const key of HOME_FILTER_KEYS) {
      const v = searchParams.get(key)
      if (v) next.set(key, v)
    }
    for (const v of searchParams.getAll('condition')) {
      next.append('condition', v)
    }
    next.set('category_id', catId)
    navigate(`/?${next.toString()}`)
    setHoveredId(null)
  }

  if (categories.length === 0) return <div className={styles.nav} />

  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        {categories.map(cat => {
          const isActive =
            selectedCategory === cat.id ||
            cat.children.some(c => c.id === selectedCategory)
          return (
            <li
              key={cat.id}
              className={styles.item}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                className={`${styles.label} ${isActive ? styles.labelActive : ''}`}
                onClick={() => navigateWithCategory(cat.id)}
              >
                {cat.name}
              </button>

              {hoveredId === cat.id && cat.children.length > 0 && (
                <div className={styles.dropdown}>
                  {cat.children.map(child => (
                    <button
                      key={child.id}
                      className={`${styles.child} ${selectedCategory === child.id ? styles.childActive : ''}`}
                      onClick={() => navigateWithCategory(child.id)}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
