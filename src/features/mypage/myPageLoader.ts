import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { User, Product, Paginated, Order } from '../../utils/types'

export type MyPageLoaderData = {
  user: User
  listings: Paginated<Product>
  buyerOrders: Paginated<Order>
}

export async function myPageLoader(): Promise<MyPageLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const emptyListings: Paginated<Product> = { items: [], total: 0, limit: 20, offset: 0 }
  const emptyOrders: Paginated<Order> = { items: [], total: 0, limit: 20, offset: 0 }
  const [user, listings, buyerOrders] = await Promise.all([
    apiFetch<User>('/api/me'),
    apiFetch<Paginated<Product>>('/api/me/listings?limit=20&offset=0').catch(() => emptyListings),
    apiFetch<Paginated<Order>>('/api/orders?role=buyer&limit=20&offset=0').catch(() => emptyOrders),
  ])
  return { user, listings, buyerOrders }
}
