import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { User, Product, Paginated, Order, LikeItem, ViewingHistoryItem } from '../../utils/types'

export type MyPageLoaderData = {
  user: User
  listings: Paginated<Product>
  recentOrders: Paginated<Order>
  likeCount: number
  historyCount: number
}

const emptyPage = <T>(): Paginated<T> => ({ items: [], total: 0, limit: 1, offset: 0 })

export async function myPageLoader(): Promise<MyPageLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const [user, listings, recentOrders, likes, history] = await Promise.all([
    apiFetch<User>('/api/me'),
    apiFetch<Paginated<Product>>('/api/me/listings?limit=2&offset=0').catch(() => emptyPage<Product>()),
    apiFetch<Paginated<Order>>('/api/orders?limit=2&offset=0').catch(() => emptyPage<Order>()),
    apiFetch<Paginated<LikeItem>>('/api/me/likes?limit=1&offset=0').catch(() => emptyPage<LikeItem>()),
    apiFetch<Paginated<ViewingHistoryItem>>('/api/me/viewing-history?limit=1&offset=0').catch(() => emptyPage<ViewingHistoryItem>()),
  ])

  return { user, listings, recentOrders, likeCount: likes.total, historyCount: history.total }
}
