import type { ActionFunctionArgs } from 'react-router-dom'
import { redirect } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import { markFeedbackSubmitted, isFeedbackSubmitted } from '../../utils/feedbackState'
import type { OrderDetail } from '../../utils/types'

export type FeedbackActionData = { error: string }

export async function feedbackAction({ params, request }: ActionFunctionArgs): Promise<Response | FeedbackActionData> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect
  const orderId = params.id!

  if (isFeedbackSubmitted(orderId)) {
    return redirect(`/orders/${orderId}/feedback/complete`)
  }
  const order = await apiFetch<OrderDetail>(`/api/orders/${orderId}`)
  if (order.has_feedback) {
    return redirect(`/orders/${orderId}/feedback/complete`)
  }

  const formData = await request.formData()
  const score = Number(formData.get('score'))
  if (!score || score < 1 || score > 5) {
    return { error: '評価を選択してください。' }
  }
  try {
    await apiFetch(`/api/orders/${orderId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    })
  } catch (err) {
    if (err instanceof Response && err.status === 409) {
      markFeedbackSubmitted(orderId)
      return redirect(`/orders/${orderId}/feedback/complete`)
    }
    throw err
  }
  markFeedbackSubmitted(orderId)
  return redirect(`/orders/${orderId}/feedback/complete`)
}
