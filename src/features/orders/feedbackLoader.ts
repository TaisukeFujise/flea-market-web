import type { LoaderFunctionArgs } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { OrderDetail } from '../../utils/types'

export type FeedbackLoaderData = {
  order: OrderDetail
}

export async function feedbackLoader({ params }: LoaderFunctionArgs): Promise<FeedbackLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect
  const order = await apiFetch<OrderDetail>(`/api/orders/${params.id!}`)
  return { order }
}
