import type { Paginated, Product, Category } from '../../utils/types'
import { apiFetch } from '../../utils/api'

export type HomeLoaderData = Paginated<Product> & { categories: Category[] }

export async function homeLoader({ request }: { request: Request }): Promise<HomeLoaderData> {
  const url = new URL(request.url)
  const qs = new URLSearchParams()

  for (const key of ['q', 'category_id', 'min_price', 'max_price', 'sort']) {
    const v = url.searchParams.get(key)
    if (v) qs.set(key, v)
  }
  // condition は複数値を repeating params で送る
  for (const c of url.searchParams.getAll('condition')) {
    qs.append('condition', c)
  }
  qs.set('limit', '20')
  qs.set('offset', '0')

  // categories が未実装でもホームを壊さないよう独立して取得
  const [products, categories] = await Promise.all([
    apiFetch<Paginated<Product>>(`/api/products?${qs}`),
    apiFetch<{ categories: Category[] }>('/api/categories')
      .then(r =>
        (r.categories ?? [])
          .map(cat => ({ ...cat, children: [...cat.children].sort((a, b) => a.name.localeCompare(b.name, 'ja')) }))
          .sort((a, b) => a.name.localeCompare(b.name, 'ja')),
      )
      .catch(() => [] as Category[]),
  ])

  return { ...products, categories }
}
