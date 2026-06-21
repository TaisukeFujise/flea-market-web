import { useReducer, useState, useCallback } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/hooks/useAuth'
import { useWebSocket } from '../../utils/hooks/useWebSocket'
import { apiFetch } from '../../utils/api'
import type { Comment, Damage, ProductImage, ModelInfo } from '../../utils/types'
import type { ProductDetailLoaderData } from './productDetailLoader'
import Avatar from '../../components/atoms/Avatar'
import ThreeDViewerModal from './ThreeDViewerModal'
import styles from './ProductDetailPage.module.css'

const CONDITION_LABEL: Record<string, string> = {
  good: 'ほぼ新品',
  fair: '目立つ傷少なめ',
  poor: '使用感あり',
}

const CONDITION_DESC: Record<string, string> = {
  good: 'AIによる判定では、目立つ傷・汚れは検出されていません。',
  fair: 'AIによる判定では、軽微な傷または汚れが検出されています。',
  poor: 'AIによる判定では、複数の傷または使用感が検出されています。',
}

const DAMAGE_TYPES = [
  { key: 'scratch', label: '傷 (scratch)' },
  { key: 'dirt', label: '汚れ (dirt)' },
  { key: 'wear', label: '使用感 (wear)' },
] as const

type Tab = 'ai' | 'description' | 'payment'

// ---- AI Tab ----

function AiTab({ damages, images }: { damages: Damage[]; images: ProductImage[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const toggle = useCallback((key: string) => {
    setOpenKey(prev => (prev === key ? null : key))
  }, [])

  return (
    <div className={styles.damageRows}>
      {DAMAGE_TYPES.map(({ key, label }) => {
        const matched = damages.filter(d => d.damage_type === key)
        const detected = matched.length > 0
        const isOpen = openKey === key

        return (
          <div key={key} className={styles.damageRow}>
            <button
              className={styles.damageRowBtn}
              onClick={() => toggle(key)}
            >
              <span className={styles.damageLabel}>{label}</span>
              <div className={styles.damageRowRight}>
                <span className={detected ? styles.detectedBadge : styles.notDetectedBadge}>
                  {detected ? '要確認' : '検出なし'}
                </span>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>›</span>
              </div>
            </button>

            {isOpen && (
              <div className={styles.damageDetail}>
                {!detected ? (
                  <p className={styles.damageNone}>この項目では傷は検出されませんでした。</p>
                ) : (
                  matched.map((dmg, idx) => {
                    const img = images.find(i => i.id === dmg.image_id)
                    if (!img) return null
                    // bbox coords are 0-1000 normalized → convert to %
                    const left = dmg.bbox_x1 / 10
                    const top = dmg.bbox_y1 / 10
                    const width = (dmg.bbox_x2 - dmg.bbox_x1) / 10
                    const height = (dmg.bbox_y2 - dmg.bbox_y1) / 10
                    return (
                      <div key={dmg.id} className={styles.damageEntry}>
                        <div className={styles.damageImgBox}>
                          <img src={img.url} alt={img.angle} className={styles.damageImg} />
                          <div
                            className={styles.bboxRect}
                            style={{
                              left: `${left}%`,
                              top: `${top}%`,
                              width: `${width}%`,
                              height: `${height}%`,
                            }}
                          />
                        </div>
                        <div className={styles.damageEntryInfo}>
                          <span className={styles.damageEntryNum}>#{idx + 1}</span>
                          <p className={styles.damageEntryAngle}>{img.angle} アングル</p>
                          {dmg.description && (
                            <p className={styles.damageDesc}>{dmg.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---- Comment state ----

type CommentState = {
  items: Comment[]
  text: string
  loading: boolean
}
type CommentAction =
  | { type: 'change_text'; text: string }
  | { type: 'submit_start' }
  | { type: 'submit_done'; comment: Comment }
  | { type: 'submit_error' }

function commentReducer(state: CommentState, action: CommentAction): CommentState {
  switch (action.type) {
    case 'change_text':
      return { ...state, text: action.text }
    case 'submit_start':
      return { ...state, loading: true }
    case 'submit_done':
      return { items: [...state.items, action.comment], text: '', loading: false }
    case 'submit_error':
      return { ...state, loading: false }
  }
}

// ---- Component ----

export default function ProductDetailPage() {
  const { product, damages: initialDamages, comments: initialComments } = useLoaderData() as ProductDetailLoaderData
  const [damages, setDamages] = useState<Damage[]>(initialDamages)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [slide, setSlide] = useState(0)
  const [liked, setLiked] = useState(product.liked)
  const [likeLoading, setLikeLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('ai')
  const [model, setModel] = useState<ModelInfo>(product.model)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [commentState, dispatchComment] = useReducer(commentReducer, {
    items: initialComments,
    text: '',
    loading: false,
  })

  const currentImage = product.images[slide]
  const isSeller = user?.uid === product.seller.id

  useWebSocket({
    onDamageDetectionComplete: () => {
      apiFetch<{ damages: Damage[] }>(`/api/products/${product.id}/damages`)
        .then(res => setDamages(res.damages))
        .catch(() => {})
    },
    onModelGenerationComplete: (payload) => {
      if (payload.product_id === product.id) {
        setModel({ status: 'done', glb_url: payload.glb_url })
      }
    },
    onModelGenerationFailed: (payload) => {
      if (payload.product_id === product.id) {
        setModel({ status: 'failed', glb_url: null })
      }
    },
  })

  function handleLike() {
    if (!user) { navigate('/login'); return }
    if (likeLoading) return
    const newLiked = !liked
    const prev = liked
    setLiked(newLiked)
    setLikeLoading(true)
    apiFetch(`/api/products/${product.id}/likes`, { method: newLiked ? 'POST' : 'DELETE' })
      .catch(() => setLiked(prev))
      .finally(() => setLikeLoading(false))
  }

  function handleBuy() {
    if (!user) { navigate('/login'); return }
    navigate(`/products/${product.id}/purchase`)
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentState.text.trim() || commentState.loading) return
    if (!user) { navigate('/login'); return }
    dispatchComment({ type: 'submit_start' })
    try {
      const res = await apiFetch<{ id: string; content: string; created_at: string }>(
        `/api/products/${product.id}/comments`,
        { method: 'POST', body: JSON.stringify({ content: commentState.text.trim() }) },
      )
      dispatchComment({
        type: 'submit_done',
        comment: {
          id: res.id,
          content: res.content,
          created_at: res.created_at,
          user: {
            id: user.uid,
            display_name: user.displayName ?? '',
            avatar_url: user.photoURL ?? '',
          },
        },
      })
    } catch {
      dispatchComment({ type: 'submit_error' })
    }
  }

  return (
    <>
    <div className={styles.page}>
      <div className={styles.topGrid}>
        {/* Gallery column */}
        <div className={styles.galleryCol}>
          <div className={styles.sliderWrapper}>
            <button
              className={styles.sliderBtn}
              onClick={() => setSlide(s => s - 1)}
              disabled={slide === 0}
              aria-label="前の画像"
            >‹</button>
            <div className={styles.imageContainer}>
              {currentImage && (
                <img
                  key={currentImage.id}
                  src={currentImage.url}
                  alt={product.title}
                  className={styles.mainImage}
                />
              )}
              {model !== null && (
                <button
                  className={styles.threeDBtn}
                  onClick={() => setViewerOpen(true)}
                  disabled={model.status !== 'done' || !model.glb_url}
                  title={
                    model.status === 'failed'
                      ? '3Dモデルの生成に失敗しました'
                      : model.status === 'processing'
                        ? '3Dモデルを生成中...'
                        : undefined
                  }
                  aria-label="3Dモデルを見る"
                >
                  3D
                </button>
              )}
            </div>
            <button
              className={styles.sliderBtn}
              onClick={() => setSlide(s => s + 1)}
              disabled={slide === product.images.length - 1}
              aria-label="次の画像"
            >›</button>
          </div>

          <div className={styles.thumbnails}>
            {product.images.map((img, i) => (
              <button
                key={img.id}
                className={`${styles.thumbnail} ${i === slide ? styles.thumbnailActive : ''}`}
                onClick={() => setSlide(i)}
                aria-label={img.angle}
              >
                <img src={img.url} alt={img.angle} />
              </button>
            ))}
          </div>
        </div>

        {/* Info column (sticky) */}
        <div className={styles.infoCol}>
          {/* Top row: AI badge + like */}
          <div className={styles.infoTopRow}>
            <span className={styles.aiCheckedBadge}>✓ AI Checked</span>
            <button
              className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
              onClick={handleLike}
              disabled={likeLoading}
              aria-label={liked ? 'いいね解除' : 'いいね'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{liked ? 'いいね済み' : 'いいね'}</span>
            </button>
          </div>

          {/* Title & price */}
          <h1 className={styles.title}>{product.title}</h1>
          <p className={styles.price}>¥{product.price.toLocaleString()}</p>

          {/* Condition block */}
          <div className={styles.condBlock}>
            <p className={styles.condBlockTitle}>AIコンディション</p>
            <span className={styles.condBadge} data-condition={product.condition}>
              {CONDITION_LABEL[product.condition]}
            </span>
            <p className={styles.condDesc}>{CONDITION_DESC[product.condition]}</p>
            <p className={styles.condDescSub}>詳細はAIコンディションレポートをご覧ください。</p>
          </div>

          {/* Buy button */}
          <button
            className={styles.buyBtn}
            onClick={handleBuy}
            disabled={isSeller || product.status === 'sold_out'}
          >
            {product.status === 'sold_out' ? 'Sold Out' : '購入する'}
          </button>

          {/* Seller card */}
          <div className={styles.sellerCard}>
            <Avatar src={product.seller.avatar_url} name={product.seller.display_name} size="lg" />
            <div>
              <p className={styles.sellerName}>{product.seller.display_name}</p>
              <p className={styles.sellerRating}>
                ⭐ {product.seller.rating_avg != null ? product.seller.rating_avg.toFixed(1) : '-'}（{product.seller.rating_count}件）
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed section */}
      <div className={styles.below}>
        <div className={styles.tabs}>
          {([
            { key: 'ai', label: 'AIコンディションレポート' },
            { key: 'description', label: '商品説明' },
            { key: 'payment', label: '配送・決済' },
          ] as const).map(t => (
            <button
              key={t.key}
              className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'ai' && (
            <AiTab damages={damages} images={product.images} />
          )}

          {activeTab === 'description' && (
            <div className={styles.descSection}>
              <div className={styles.descRow}>
                <p className={styles.descLabel}>商品名</p>
                <p className={styles.descValue}>{product.title}</p>
              </div>
              <div className={styles.descRow}>
                <p className={styles.descLabel}>値段</p>
                <p className={styles.descValue}>¥{product.price.toLocaleString()}</p>
              </div>
              <div className={styles.descRow}>
                <p className={styles.descLabel}>説明</p>
                <div>
                  <p className={styles.description}>{product.description}</p>
                  {product.condition_note && (
                    <p className={styles.conditionNote}>{product.condition_note}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className={styles.paymentInfo}>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>支払い方法</span>
                <span className={styles.paymentValue}>クレジットカード / プラットフォーム内決済</span>
              </div>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>発送元</span>
                <span className={styles.paymentValue}>出品者より発送</span>
              </div>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>発送までの日数</span>
                <span className={styles.paymentValue}>取引成立後、出品者と相談</span>
              </div>
              <div className={styles.paymentRow}>
                <span className={styles.paymentLabel}>返品・キャンセル</span>
                <span className={styles.paymentValue}>取引成立後のキャンセルは原則不可</span>
              </div>
            </div>
          )}
        </div>

        {/* Q&A */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Q&amp;A</h2>
          <div className={styles.commentList}>
            {commentState.items.length === 0 && (
              <p className={styles.emptyComments}>コメントはまだありません。</p>
            )}
            {commentState.items.map(c => (
              <div key={c.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <Avatar src={c.user.avatar_url} name={c.user.display_name} size="sm" />
                  <strong>{c.user.display_name}</strong>
                  <span className={styles.commentDate}>
                    {new Date(c.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className={styles.commentContent}>{c.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
            <textarea
              value={commentState.text}
              onChange={e => dispatchComment({ type: 'change_text', text: e.target.value })}
              placeholder={user ? 'コメントを入力...' : 'コメントするにはログインが必要です'}
              className={styles.commentTextarea}
              rows={3}
            />
            <button
              type="submit"
              disabled={!commentState.text.trim() || commentState.loading}
              className={styles.commentSubmit}
            >
              {commentState.loading ? '送信中...' : 'コメントする'}
            </button>
          </form>
        </section>
      </div>
    </div>

    {viewerOpen && model?.status === 'done' && model.glb_url && (
      <ThreeDViewerModal
        glbUrl={model.glb_url}
        damages={damages}
        images={product.images}
        onClose={() => setViewerOpen(false)}
      />
    )}
    </>
  )
}
