import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Category } from '../../utils/types'
import { apiFetch } from '../../utils/api'
import styles from './CategoryNav.module.css'

export default function CategoryNav() {
  const [categories, setCategories] = useState<Category[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedCategory = searchParams.get('category_id') ?? ''

  useEffect(() => {
    apiFetch<{ categories: Category[] }>('/api/categories')
      .then(res => setCategories(res.categories))
      .catch(() => {})
  }, [])

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
                onClick={() => {
                  navigate(`/?category_id=${cat.id}`)
                  setHoveredId(null)
                }}
              >
                {cat.name}
              </button>

              {hoveredId === cat.id && cat.children.length > 0 && (
                <div className={styles.dropdown}>
                  {cat.children.map(child => (
                    <button
                      key={child.id}
                      className={`${styles.child} ${selectedCategory === child.id ? styles.childActive : ''}`}
                      onClick={() => {
                        navigate(`/?category_id=${child.id}`)
                        setHoveredId(null)
                      }}
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
