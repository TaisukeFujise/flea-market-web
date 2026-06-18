import { protectedLoader } from '../../utils/auth'
import { apiFetch } from '../../utils/api'
import type { Category } from '../../utils/types'

export type InfoLoaderData = {
  categories: Category[]
}

export async function infoLoader(): Promise<InfoLoaderData | Response> {
  const redirect = await protectedLoader()
  if (redirect) return redirect

  const categories = await apiFetch<{ categories: Category[] }>('/api/categories')
    .then(r => r.categories ?? [])
    .catch(() => [] as Category[])

  return { categories }
}
