import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { Product, Paginated } from '../../utils/types'

export type MyListingLoaderData = {
  items: Product[]
  total: number
}

export async function myListingLoader(): Promise<MyListingLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const data = await apiFetch<Paginated<Product>>('/api/me/listings?limit=20&offset=0')
  return { items: data.items, total: data.total }
}
