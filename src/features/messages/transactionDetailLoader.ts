import type { LoaderFunctionArgs } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { OrderDetail, Paginated, Message } from '../../utils/types'

export type TransactionDetailLoaderData = {
  order: OrderDetail
  messages: Message[]
}

export async function transactionDetailLoader({ params }: LoaderFunctionArgs): Promise<TransactionDetailLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  // Sequential: message_room_id is required to fetch messages
  const order = await apiFetch<OrderDetail>(`/api/orders/${params.id!}`)
  const messagesData = await apiFetch<Paginated<Message>>(`/api/message-rooms/${order.message_room_id}/messages`)
  return { order, messages: messagesData.items }
}
