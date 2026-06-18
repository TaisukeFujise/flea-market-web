import { createContext, useContext } from 'react'

export type NewMessagePayload = { room_id: string }

export type MessageContextValue = {
  lastNewMessagePayload: NewMessagePayload | null
  notifyNewMessage: (payload: NewMessagePayload) => void
}

export const MessageContext = createContext<MessageContextValue>({
  lastNewMessagePayload: null,
  notifyNewMessage: () => {},
})

export function useMessageContext() {
  return useContext(MessageContext)
}
