import { useState, useEffect, useRef } from 'react'
import { useLoaderData, useNavigate, Link } from 'react-router-dom'
import { useMessageContext } from '../../utils/hooks/MessageContext'
import { apiFetch } from '../../utils/api'
import type { Message, Paginated } from '../../utils/types'
import type { TransactionDetailLoaderData } from './transactionDetailLoader'
import Avatar from '../../components/atoms/Avatar'
import styles from './TransactionDetailPage.module.css'

export default function TransactionDetailPage() {
  const { order, messages: initialMessages } = useLoaderData() as TransactionDetailLoaderData
  const navigate = useNavigate()
  const { lastNewMessagePayload } = useMessageContext()

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = order.role
  const messageRoomId = order.message_room_id
  const isPending = order.status === 'pending'

  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (!mountedRef.current) {
      mountedRef.current = true
      bottomRef.current?.scrollIntoView()
      return
    }
    const isNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 100
    if (isNearBottom) bottomRef.current?.scrollIntoView()
  }, [messages])

  useEffect(() => {
    if (lastNewMessagePayload?.room_id !== messageRoomId) return
    let cancelled = false
    void apiFetch<Paginated<Message>>(`/api/message-rooms/${messageRoomId}/messages`)
      .then(data => { if (!cancelled) setMessages(data.items) })
      .catch(() => { if (!cancelled) setError('メッセージの更新に失敗しました。') })
    return () => { cancelled = true }
  }, [lastNewMessagePayload, messageRoomId])

  async function handleSend() {
    const content = inputText.trim()
    if (!content || sending) return
    setSending(true)
    setError(null)
    try {
      await apiFetch(`/api/message-rooms/${messageRoomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
    } catch {
      setError('メッセージの送信に失敗しました。')
      setSending(false)
      return
    }

    setInputText('')

    try {
      const data = await apiFetch<Paginated<Message>>(`/api/message-rooms/${messageRoomId}/messages`)
      setMessages(data.items)
    } catch (err) {
      console.error('メッセージ一覧の再取得に失敗しました。', err)
    } finally {
      setSending(false)
    }
  }

  async function handleComplete() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      })
      navigate(`/orders/${order.id}/feedback`)
    } catch {
      setError('受け取り完了処理に失敗しました。')
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await apiFetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      })
      navigate('/mypage/trades')
    } catch {
      setError('キャンセル処理に失敗しました。')
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/mypage/trades" className={styles.backLink}>← 取引一覧</Link>
        <div className={styles.productInfo}>
          <img
            src={order.product.thumbnail_url}
            alt={order.product.title}
            className={styles.thumbnail}
          />
          <div>
            <p className={styles.productTitle}>{order.product.title}</p>
            <p className={styles.price}>¥{order.price.toLocaleString()}</p>
          </div>
        </div>
        <div className={styles.counterpart}>
          <Avatar
            src={order.counterpart.avatar_url}
            name={order.counterpart.display_name}
            size="sm"
          />
          <span>{order.counterpart.display_name}</span>
        </div>
        {isPending && (
          <div className={styles.actions}>
            {role === 'buyer' && (
              <button
                type="button"
                className={styles.completeButton}
                onClick={() => void handleComplete()}
                disabled={submitting}
              >
                受け取り完了
              </button>
            )}
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => void handleCancel()}
              disabled={submitting}
            >
              キャンセル
            </button>
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.messageList} ref={listRef}>
        {messages.map(msg => {
          const ismine = msg.sender.id !== order.counterpart?.id
          return (
            <div
              key={msg.id}
              className={`${styles.messageItem} ${ismine ? styles.mine : styles.theirs}`}
            >
              {!ismine && (
                <p className={styles.senderName}>{msg.sender.display_name}</p>
              )}
              <p className={styles.content}>{msg.content}</p>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {isPending && (
        <div className={styles.inputArea}>
          <textarea
            className={styles.textarea}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="メッセージを入力"
            rows={3}
          />
          <button
            type="button"
            className={styles.sendButton}
            onClick={() => void handleSend()}
            disabled={sending || !inputText.trim()}
          >
            {sending ? '送信中...' : '送信'}
          </button>
        </div>
      )}
    </div>
  )
}
