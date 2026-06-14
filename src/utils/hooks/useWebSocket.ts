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
    let retryCount = 0

    // Finding #3: env var 未設定なら即終了
    if (!WS_BASE_URL) {
      console.error('[useWebSocket] VITE_WS_BASE_URL is not set')
      return
    }

    function scheduleReconnect() {
      if (stopped) return
      // Finding #5: 指数バックオフ + ジッター（最大30秒）
      const delay = Math.min(1000 * 2 ** retryCount, 30000) + Math.random() * 1000
      retryCount++
      reconnectTimer = setTimeout(() => { void connect() }, delay)
    }

    async function connect() {
      if (stopped) return

      // Always try to get a fresh token so long-lived connections survive the 1h expiry
      let token = localStorage.getItem('token')
      if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken(true)
          localStorage.setItem('token', token)
        } catch {
          // getIdToken失敗時は localStorage の古いトークンで接続を試みる
          // 接続できなければ onclose → バックオフ後に再試行
        }
      }
      // Finding #4: token がなくても再試行をスケジュール（auth 未解決の場合を含む）
      if (!token) {
        scheduleReconnect()
        return
      }
      if (stopped) return

      ws = new WebSocket(`${WS_BASE_URL}/ws?token=${token}`)

      ws.addEventListener('open', () => {
        retryCount = 0  // 接続成功でバックオフリセット
      })

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
        scheduleReconnect()
      })

      ws.addEventListener('error', () => {
        const dead = ws
        ws = null
        dead?.close()
      })
    }

    void connect()

    return () => {
      stopped = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [])
}
