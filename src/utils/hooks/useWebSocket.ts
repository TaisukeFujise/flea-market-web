import { useEffect, useRef } from 'react'
import { auth } from '../../firebase'
import type { WsEvent } from '../types'

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL

export type WsHandlers = {
  onNewMessage?: (payload: Extract<WsEvent, { type: 'new_message' }>['payload']) => void
  onDamageDetectionComplete?: (payload: Extract<WsEvent, { type: 'damage_detection_complete' }>['payload']) => void
  onModelGenerationComplete?: (payload: Extract<WsEvent, { type: 'model_generation_complete' }>['payload']) => void
}

export function useWebSocket(handlers: WsHandlers) {
  const handlersRef = useRef(handlers)

  // Keep handlers fresh without triggering reconnects
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    async function connect() {
      if (stopped) return

      // Always try to get a fresh token so long-lived connections survive the 1h expiry
      let token = localStorage.getItem('token')
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken()
          localStorage.setItem('token', token)
        } catch {
          // getIdToken失敗時は localStorage の古いトークンで接続を試みる
          // 接続できなければ onclose → 3秒後に再試行
        }
      }
      if (!token || stopped) return

      ws = new WebSocket(`${WS_BASE_URL}/ws?token=${token}`)

      ws.addEventListener('message', (e: MessageEvent) => {
        let event: WsEvent
        try {
          event = JSON.parse(e.data as string) as WsEvent
        } catch {
          return
        }
        const h = handlersRef.current
        if (event.type === 'new_message') {
          h.onNewMessage?.(event.payload)
        } else if (event.type === 'damage_detection_complete') {
          h.onDamageDetectionComplete?.(event.payload)
        } else if (event.type === 'model_generation_complete') {
          h.onModelGenerationComplete?.(event.payload)
        }
      })

      ws.addEventListener('close', () => {
        if (stopped) return
        reconnectTimer = setTimeout(() => { connect() }, 3000)
      })

      ws.addEventListener('error', () => {
        ws?.close()
      })
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [])
}
