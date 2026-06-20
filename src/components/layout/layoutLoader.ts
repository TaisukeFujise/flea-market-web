import type { Category } from '../../utils/types'
import { apiFetch } from '../../utils/api'

export type LayoutLoaderData = {
  categories: Category[]
}

export async function layoutLoader(): Promise<LayoutLoaderData> {
  const categories = await apiFetch<{ categories: Category[] }>('/api/categories')
    .then(r => r.categories ?? [])
    .catch(() => [] as Category[])
  return { categories }
}
