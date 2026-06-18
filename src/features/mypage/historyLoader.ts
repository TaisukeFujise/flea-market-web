import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { ViewingHistoryItem, Paginated } from '../../utils/types'

export type HistoryLoaderData = {
  items: ViewingHistoryItem[]
  total: number
}

export async function historyLoader(): Promise<HistoryLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const data = await apiFetch<Paginated<ViewingHistoryItem>>('/api/me/viewing-history?limit=20&offset=0')
  return { items: data.items, total: data.total }
}
