import type { LoaderFunctionArgs } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { OrderDetail, Paginated, Message } from '../../utils/types'

export const MESSAGE_LIMIT = 20

export type TransactionDetailLoaderData = {
  order: OrderDetail
  messages: Message[]
  messagesTotal: number
  messagesOffset: number
}

export async function transactionDetailLoader({ params }: LoaderFunctionArgs): Promise<TransactionDetailLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const order = await apiFetch<OrderDetail>(`/api/orders/${params.id!}`)

  const firstPage = await apiFetch<Paginated<Message>>(
    `/api/message-rooms/${order.message_room_id}/messages?limit=${MESSAGE_LIMIT}`
  )
  const total = firstPage.total
  const offset = Math.max(0, total - MESSAGE_LIMIT)

  const messagesData = offset === 0
    ? firstPage
    : await apiFetch<Paginated<Message>>(
        `/api/message-rooms/${order.message_room_id}/messages?limit=${MESSAGE_LIMIT}&offset=${offset}`
      )

  return { order, messages: messagesData.items, messagesTotal: total, messagesOffset: offset }
}
