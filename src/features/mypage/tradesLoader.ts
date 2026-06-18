import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { Paginated, Order } from '../../utils/types'

export type TradesLoaderData = {
  orders: Order[]
}

export async function tradesLoader(): Promise<TradesLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const data = await apiFetch<Paginated<Order>>('/api/orders')
  const pendingOrders = data.items.filter(o => o.status === 'pending')
  return { orders: pendingOrders }
}
