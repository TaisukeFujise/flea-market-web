import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { LikeItem, Paginated } from '../../utils/types'

export type LikesLoaderData = {
  items: LikeItem[]
  total: number
}

export async function likesLoader(): Promise<LikesLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const data = await apiFetch<Paginated<LikeItem>>('/api/me/likes?limit=20&offset=0')
  return { items: data.items, total: data.total }
}
