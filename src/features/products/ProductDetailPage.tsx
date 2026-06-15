import { useReducer, useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import { useAuth } from '../../utils/hooks/useAuth'
import { apiFetch } from '../../utils/api'
import type { Comment } from '../../utils/types'
import type { ProductDetailLoaderData } from './productDetailLoader'
import styles from './ProductDetailPage.module.css'

const CONDITION_LABEL: Record<string, string> = {
  good: 'ほぼ新品',
  fair: '目立つ傷少なめ',
  poor: '使用感あり',
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
  const { product, damages, comments: initialComments } = useLoaderData() as ProductDetailLoaderData
  const { user } = useAuth()
  const navigate = useNavigate()

  // { index: current image index, w/h: natural dimensions for bbox scaling (0 = not loaded yet) }
  const [slide, setSlide] = useState({ index: 0, w: 0, h: 0 })
  const [liked, setLiked] = useState(product.liked)
  const [likeLoading, setLikeLoading] = useState(false)
  const [commentState, dispatchComment] = useReducer(commentReducer, {
    items: initialComments,
    text: '',
    loading: false,
  })

  const currentImage = product.images[slide.index]
  const currentDamages = damages.filter(d => d.image_id === currentImage?.id)
  const isSeller = user?.uid === product.seller.id

  function goToSlide(index: number) {
    setSlide({ index, w: 0, h: 0 })
  }

  function handleLike() {
    if (!user) {
      navigate('/login')
      return
    }
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
    if (!user) {
      navigate('/login')
      return
    }
    navigate(`/products/${product.id}/purchase`)
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentState.text.trim() || commentState.loading) return
    if (!user) {
      navigate('/login')
      return
    }
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
    <div className={styles.page}>
      {/* Image gallery */}
      <div className={styles.gallery}>
        <div className={styles.sliderWrapper}>
          <button
            className={`${styles.sliderBtn} ${styles.sliderBtnPrev}`}
            onClick={() => goToSlide(slide.index - 1)}
            disabled={slide.index === 0}
            aria-label="前の画像"
          >
            ‹
          </button>

          <div className={styles.imageContainer}>
            {currentImage && (
              <>
                <img
                  key={currentImage.id}
                  src={currentImage.url}
                  alt={product.title}
                  className={styles.mainImage}
                  onLoad={e => {
                    const img = e.currentTarget
                    setSlide(s => ({ ...s, w: img.naturalWidth, h: img.naturalHeight }))
                  }}
                />
                {slide.w > 0 &&
                  currentDamages.map(d => (
                    <div
                      key={d.id}
                      className={styles.bboxMarker}
                      style={
                        {
                          '--bbox-left': `${(d.bbox_x1 / slide.w) * 100}%`,
                          '--bbox-top': `${(d.bbox_y1 / slide.h) * 100}%`,
                          '--bbox-width': `${((d.bbox_x2 - d.bbox_x1) / slide.w) * 100}%`,
                          '--bbox-height': `${((d.bbox_y2 - d.bbox_y1) / slide.h) * 100}%`,
                        } as React.CSSProperties
                      }
                      title={d.description}
                    />
                  ))}
              </>
            )}
          </div>

          <button
            className={`${styles.sliderBtn} ${styles.sliderBtnNext}`}
            onClick={() => goToSlide(slide.index + 1)}
            disabled={slide.index === product.images.length - 1}
            aria-label="次の画像"
          >
            ›
          </button>
        </div>

        {/* Thumbnails */}
        <div className={styles.thumbnails}>
          {product.images.map((img, i) => (
            <button
              key={img.id}
              className={`${styles.thumbnail} ${i === slide.index ? styles.thumbnailActive : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={img.angle}
            >
              <img src={img.url} alt={img.angle} />
            </button>
          ))}
        </div>
      </div>

      {/* Product info */}
      <div className={styles.info}>
        <h1 className={styles.title}>{product.title}</h1>
        <p className={styles.price}>¥{product.price.toLocaleString()}</p>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.likeButton} onClick={handleLike} disabled={likeLoading}>
            {liked ? '♥ いいね済み' : '♡ いいね'}
          </button>
          {!isSeller && (
            <button
              className={styles.buyButton}
              onClick={handleBuy}
              disabled={product.status === 'sold_out'}
            >
              {product.status === 'sold_out' ? '売り切れ' : '購入する'}
            </button>
          )}
        </div>

        {/* Condition */}
        <section className={styles.section}>
          <h2>商品の状態</h2>
          <p>{CONDITION_LABEL[product.condition]}</p>
          {product.condition_note && (
            <p className={styles.conditionNote}>{product.condition_note}</p>
          )}
        </section>

        {/* Description */}
        <section className={styles.section}>
          <h2>商品説明</h2>
          <p className={styles.description}>{product.description}</p>
        </section>

        {/* Seller */}
        <section className={styles.section}>
          <h2>出品者</h2>
          <div className={styles.seller}>
            <img
              src={product.seller.avatar_url}
              alt={product.seller.display_name}
              className={styles.sellerAvatar}
            />
            <div>
              <p className={styles.sellerName}>{product.seller.display_name}</p>
              <p className={styles.sellerRating}>
                ⭐ {product.seller.rating_avg != null ? product.seller.rating_avg.toFixed(1) : '-'}（{product.seller.rating_count}件）
              </p>
            </div>
          </div>
        </section>

        {/* Q&A */}
        <section className={styles.section}>
          <h2>Q&amp;A</h2>
          <div className={styles.commentList}>
            {commentState.items.length === 0 && (
              <p className={styles.emptyComments}>コメントはまだありません。</p>
            )}
            {commentState.items.map(c => (
              <div key={c.id} className={styles.comment}>
                <div className={styles.commentHeader}>
                  <img
                    src={c.user.avatar_url}
                    alt={c.user.display_name}
                    className={styles.commentAvatar}
                  />
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
  )
}
