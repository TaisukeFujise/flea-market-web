import type { ActionFunctionArgs } from 'react-router-dom'
import { redirect } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'

export async function feedbackAction({ params, request }: ActionFunctionArgs): Promise<Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect
  const orderId = params.id!
  const formData = await request.formData()
  const score = Number(formData.get('score'))
  try {
    await apiFetch(`/api/orders/${orderId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    })
  } catch (err) {
    // 送信済みの場合も完了画面へ（二重送信防止はバックエンドに委ねる）
    if (err instanceof Response && err.status === 409) {
      return redirect(`/orders/${orderId}/feedback/complete`)
    }
    throw err
  }
  return redirect(`/orders/${orderId}/feedback/complete`)
}
