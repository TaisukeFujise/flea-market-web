import { useState, useEffect, useRef } from 'react'
import { useLoaderData, useNavigate, Link } from 'react-router-dom'
import { useMessageContext } from '../../utils/hooks/MessageContext'
import { apiFetch } from '../../utils/api'
import { isFeedbackSubmitted } from '../../utils/feedbackState'
import type { Message, Paginated } from '../../utils/types'
import type { TransactionDetailLoaderData } from './transactionDetailLoader'
import { MESSAGE_LIMIT } from './transactionDetailLoader'
import Avatar from '../../components/atoms/Avatar'
import styles from './TransactionDetailPage.module.css'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatMsgTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

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
    const newOffset = Math.max(0, totalRef.current + 1 - MESSAGE_LIMIT)
    void apiFetch<Paginated<Message>>(
      `/api/message-rooms/${messageRoomId}/messages?limit=${MESSAGE_LIMIT}&offset=${newOffset}`
    )
      .then(data => {
        if (!cancelled) {
          setMessages(data.items)
          setOffset(newOffset)
          totalRef.current = data.total
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
      totalRef.current = data.total
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
      const newOffset = Math.max(0, totalRef.current + 1 - MESSAGE_LIMIT)
      const data = await apiFetch<Paginated<Message>>(
        `/api/message-rooms/${messageRoomId}/messages?limit=${MESSAGE_LIMIT}&offset=${newOffset}`
      )
      setMessages(data.items)
      setOffset(newOffset)
      totalRef.current = data.total
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
      {/* ブレッドクラム */}
      <nav className={styles.breadcrumb}>
        <Link to="/mypage/trades" className={styles.breadcrumbLink}>取引中一覧</Link>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <span>取引詳細</span>
      </nav>

      <div className={styles.pageTitleRow}>
        <h1 className={styles.pageTitle}>取引詳細</h1>
        <span className={styles.statusChip} data-status={order.status}>
          {order.status === 'pending' ? '取引中' : order.status === 'completed' ? '取引終了' : 'キャンセル'}
        </span>
      </div>

      {/* ステータスバナー */}
      {order.status !== 'cancelled' && (
        <div className={styles.statusBanner}>
          <p className={styles.statusTitle}>
            {isPending && role === 'buyer' && '商品を受取ってください'}
            {isPending && role === 'seller' && '受け取り評価を待っています'}
            {order.status === 'completed' && '取引が完了しました'}
          </p>
          <div className={styles.steps}>
            <div className={styles.stepNode}>
              <div className={styles.stepDotDone} />
              <span className={styles.stepLabel}>購入</span>
            </div>
            <div className={`${styles.stepConnector} ${order.status === 'completed' ? styles.stepConnectorDone : ''}`} />
            <div className={styles.stepNode}>
              <div className={`${styles.stepDot} ${order.status === 'completed' ? styles.stepDotDone : ''}`} />
              <span className={styles.stepLabel}>取引終了</span>
            </div>
          </div>
          <p className={styles.statusSub}>
            {isPending && role === 'buyer' && 'お取引が完了しましたらお知らせください。'}
            {isPending && role === 'seller' && '購入者が受け取り完了をするまでお待ちください。'}
            {order.status === 'completed' && 'ご利用ありがとうございました。'}
          </p>
          <div className={styles.statusActions}>
            {isPending && role === 'buyer' && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void handleComplete()}
                disabled={submitting}
              >
                受け取り評価
              </button>
            )}
            {isPending && role === 'seller' && (
              <button type="button" className={styles.primaryButton} disabled>
                受け取り評価待ち
              </button>
            )}
            {order.status === 'completed' && !(order.has_feedback || isFeedbackSubmitted(order.id)) && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => navigate(`/orders/${order.id}/feedback`)}
                disabled={submitting}
              >
                評価を送る
              </button>
            )}
            {order.status === 'completed' && (order.has_feedback || isFeedbackSubmitted(order.id)) && (
              <span className={styles.evaluatedBadge}>評価済み</span>
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
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className={styles.cancelledBanner}>
          <p className={styles.cancelledText}>この取引はキャンセルされました</p>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {/* 商品情報 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>商品情報</h2>
        <div className={styles.productCard}>
          {order.product.thumbnail_url ? (
            <img
              src={order.product.thumbnail_url}
              alt={order.product.title}
              className={styles.productThumbnail}
            />
          ) : (
            <div className={styles.productThumbnail} />
          )}
          <div className={styles.productInfo}>
            <p className={styles.productTitle}>{order.product.title}</p>
            <p className={styles.productPrice}>¥{order.price.toLocaleString()}</p>
            <Link to={`/products/${order.product.id}`} className={styles.productLink}>
              商品ページを見る
            </Link>
          </div>
        </div>
        <div className={styles.counterpartRow}>
          <Avatar
            src={order.counterpart.avatar_url}
            name={order.counterpart.display_name}
            size="sm"
          />
          <span className={styles.counterpartName}>{order.counterpart.display_name}</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            className={styles.chevron}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </section>

      {/* 取引情報 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>取引情報</h2>
        <dl className={styles.infoList}>
          <div className={styles.infoRow}>
            <dt className={styles.infoLabel}>注文ID</dt>
            <dd className={styles.infoValue}>{order.id}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt className={styles.infoLabel}>購入日</dt>
            <dd className={styles.infoValue}>{formatDate(order.created_at)}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt className={styles.infoLabel}>お支払金額</dt>
            <dd className={styles.infoValue}>¥{order.price.toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      {/* メッセージ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>メッセージ</h2>
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
                  <Avatar
                    src={order.counterpart.avatar_url}
                    name={order.counterpart.display_name}
                    size="sm"
                  />
                )}
                <div className={styles.messageBubbleWrapper}>
                  <p className={`${styles.bubble} ${ismine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                    {msg.content}
                  </p>
                  <span className={styles.msgTime}>{formatMsgTime(msg.created_at)}</span>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputArea}>
          {!canChat && (
            <p className={styles.disabledNotice}>この取引はキャンセルされました。チャットは利用できません。</p>
          )}
          <div className={styles.inputRow}>
            <textarea
              className={styles.textarea}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="メッセージを入力"
              rows={2}
              disabled={!canChat}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleSend()
              }}
            />
            <button
              type="button"
              className={styles.sendButton}
              onClick={() => void handleSend()}
              disabled={!canChat || sending || !inputText.trim()}
            >
              {sending ? '...' : '送信'}
            </button>
          </div>
          <p className={styles.inputNote}>※取引完了後、連絡先のメッセージは開示されません</p>
        </div>
      </section>
    </div>
  )
}
