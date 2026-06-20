import type { LoaderFunctionArgs } from 'react-router-dom'
import { redirect } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import { isFeedbackSubmitted } from '../../utils/feedbackState'
import type { OrderDetail } from '../../utils/types'

export type FeedbackLoaderData = {
  order: OrderDetail
}

export async function feedbackLoader({ params }: LoaderFunctionArgs): Promise<FeedbackLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect
  if (isFeedbackSubmitted(params.id!)) {
    return redirect(`/orders/${params.id!}/feedback/complete`)
  }
  const order = await apiFetch<OrderDetail>(`/api/orders/${params.id!}`)
  if (order.status !== 'completed') {
    return redirect(`/orders/${params.id!}`)
  }
  if (order.has_feedback) {
    return redirect(`/orders/${params.id!}/feedback/complete`)
  }
  return { order }
}
