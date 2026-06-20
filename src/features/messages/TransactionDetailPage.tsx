import { useState, useEffect, useRef } from 'react'
import { useLoaderData, useNavigate, Link } from 'react-router-dom'
import { useMessageContext } from '../../utils/hooks/MessageContext'
import { apiFetch } from '../../utils/api'
import type { Message, Paginated } from '../../utils/types'
import type { TransactionDetailLoaderData } from './transactionDetailLoader'
import { MESSAGE_LIMIT } from './transactionDetailLoader'
import Avatar from '../../components/atoms/Avatar'
import styles from './TransactionDetailPage.module.css'

export default function TransactionDetailPage() {
  const { order, messages: initialMessages, messagesTotal, messagesOffset } = useLoaderData() as TransactionDetailLoaderData
  const navigate = useNavigate()
  const { lastNewMessagePayload } = useMessageContext()

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [total, setTotal] = useState(messagesTotal)
  const [offset, setOffset] = useState(messagesOffset)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalRef = useRef(total)
  useEffect(() => { totalRef.current = total }, [total])

  const role = order.role
  const messageRoomId = order.message_room_id
  const isPending = order.status === 'pending'
  const canChat = order.status === 'pending' || order.status === 'completed'

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
    // total+1 because a new message was just received
    const newOffset = Math.max(0, totalRef.current + 1 - MESSAGE_LIMIT)
    void apiFetch<Paginated<Message>>(
      `/api/message-rooms/${messageRoomId}/messages?limit=${MESSAGE_LIMIT}&offset=${newOffset}`
    )
      .then(data => {
        if (!cancelled) {
          setMessages(data.items)
          setOffset(newOffset)
          setTotal(data.total)
        }
      })
      .catch(() => { if (!cancelled) setError('メッセージの更新に失敗しました。') })
    return () => { cancelled = true }
  }, [lastNewMessagePayload, messageRoomId])

  async function handleLoadOlder() {
    if (loadingOlder || offset === 0) return
    setLoadingOlder(true)
    const newOffset = Math.max(0, offset - MESSAGE_LIMIT)
    try {
      const data = await apiFetch<Paginated<Message>>(
        `/api/message-rooms/${messageRoomId}/messages?limit=${MESSAGE_LIMIT}&offset=${newOffset}`
      )
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        return [...data.items.filter(m => !existingIds.has(m.id)), ...prev]
      })
      setOffset(newOffset)
      setTotal(data.total)
    } catch {
      setError('以前のメッセージの読み込みに失敗しました。')
    } finally {
      setLoadingOlder(false)
    }
  }

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
      // total+1 because we just sent a message
      const newOffset = Math.max(0, totalRef.current + 1 - MESSAGE_LIMIT)
      const data = await apiFetch<Paginated<Message>>(
        `/api/message-rooms/${messageRoomId}/messages?limit=${MESSAGE_LIMIT}&offset=${newOffset}`
      )
      setMessages(data.items)
      setOffset(newOffset)
      setTotal(data.total)
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
        {(isPending || order.status === 'completed') && (
          <div className={styles.actions}>
            {isPending && role === 'buyer' && (
              <button
                type="button"
                className={styles.completeButton}
                onClick={() => void handleComplete()}
                disabled={submitting}
              >
                受け取り完了
              </button>
            )}
            {isPending && role === 'seller' && (
              <button type="button" className={styles.completeButton} disabled>
                受け取り評価待ち
              </button>
            )}
            {order.status === 'completed' && !order.has_feedback && (
              <button
                type="button"
                className={styles.completeButton}
                onClick={() => navigate(`/orders/${order.id}/feedback`)}
                disabled={submitting}
              >
                評価を送る
              </button>
            )}
            {order.status === 'completed' && order.has_feedback && (
              <span className={styles.evaluated}>評価済み</span>
            )}
            {isPending && (
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => void handleCancel()}
                disabled={submitting}
              >
                キャンセル
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.messageList} ref={listRef}>
        {offset > 0 && (
          <button
            type="button"
            className={styles.loadOlderButton}
            onClick={() => void handleLoadOlder()}
            disabled={loadingOlder}
          >
            {loadingOlder ? '読み込み中...' : '以前のメッセージを読み込む'}
          </button>
        )}
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

      <div className={styles.inputArea}>
        {!canChat && (
          <p className={styles.cancelledNotice}>この取引はキャンセルされました</p>
        )}
        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="メッセージを入力"
            rows={3}
            disabled={!canChat}
          />
          <button
            type="button"
            className={styles.sendButton}
            onClick={() => void handleSend()}
            disabled={!canChat || sending || !inputText.trim()}
          >
            {sending ? '送信中...' : '送信'}
          </button>
        </div>
      </div>
    </div>
  )
}
