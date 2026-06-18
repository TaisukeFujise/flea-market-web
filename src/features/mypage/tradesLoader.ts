import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { Paginated, Order } from '../../utils/types'

export type TradesLoaderData = {
  items: Order[]
  total: number
}

export async function tradesLoader(): Promise<TradesLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const data = await apiFetch<Paginated<Order>>('/api/orders?limit=20&offset=0')
  return { items: data.items, total: data.total }
}
