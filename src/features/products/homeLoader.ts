import type { Paginated, Product } from '../../utils/types'
import { apiFetch } from '../../utils/api'

export type HomeLoaderData = Paginated<Product>

export async function homeLoader({ request }: { request: Request }): Promise<HomeLoaderData> {
  const url = new URL(request.url)
  const qs = new URLSearchParams()

  for (const key of ['q', 'category_id', 'min_price', 'max_price', 'sort']) {
    const v = url.searchParams.get(key)
    if (v) qs.set(key, v)
  }
  for (const c of url.searchParams.getAll('condition')) {
    qs.append('condition', c)
  }
  qs.set('limit', '20')
  qs.set('offset', '0')

  return apiFetch<Paginated<Product>>(`/api/products?${qs}`)
}
