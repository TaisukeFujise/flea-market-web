import { useState } from 'react'
import type { ReactNode } from 'react'
import { MessageContext } from './MessageContext'
import type { NewMessagePayload } from './MessageContext'

export function MessageProvider({ children }: { children: ReactNode }) {
  const [lastNewMessagePayload, setLastNewMessagePayload] = useState<NewMessagePayload | null>(null)

  return (
    <MessageContext.Provider value={{ lastNewMessagePayload, notifyNewMessage: setLastNewMessagePayload }}>
      {children}
    </MessageContext.Provider>
  )
}
