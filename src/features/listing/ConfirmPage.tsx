import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import type { ProductCreateResponse } from '../../utils/types'
import { useListingContext } from './ListingContext'
import styles from './ConfirmPage.module.css'

const CONDITION_LABELS: Record<'good' | 'fair' | 'poor', string> = {
  good: '良い',
  fair: 'やや傷あり',
  poor: '傷あり',
}

const ANGLE_LABELS = ['正面', '右側面', '背面', '左側面', '上面']

export default function ConfirmPage() {
  const navigate = useNavigate()
  const { state, dispatch: listingDispatch } = useListingContext()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!state.formData) {
    return <Navigate to="/listing/info" replace />
  }

  const { formData } = state
  const isReadyToSubmit = state.detectionStatus === 'complete'

  async function handleSubmit() {
    if (!formData) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await apiFetch<ProductCreateResponse>('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          image_ids: state.imageIds,
          category_id: formData.categoryId,
          title: formData.title,
          description: formData.description,
          price: formData.price,
        }),
      })
      listingDispatch({ type: 'LISTING_COMPLETE', productId: res.id })
      navigate('/listing/complete', { state: { productId: res.id } })
    } catch (err) {
      if (err instanceof Response && err.status === 400) {
        setSubmitError('傷検出が完了していません。しばらく待ってから再度お試しください。')
      } else {
        setSubmitError('出品に失敗しました。もう一度お試しください。')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>出品内容を確認</h1>

      {state.capturedUrls.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>商品画像</h2>
          <img
            src={state.capturedUrls[selectedImageIndex]}
            alt={ANGLE_LABELS[selectedImageIndex]}
            className={styles.mainImage}
          />
          <div className={styles.thumbnailStrip}>
            {state.capturedUrls.map((url, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.thumbnailButton} ${i === selectedImageIndex ? styles.thumbnailActive : ''}`}
                onClick={() => setSelectedImageIndex(i)}
              >
                <img src={url} alt={ANGLE_LABELS[i]} className={styles.thumbnail} />
                <span className={styles.angleLabel}>{ANGLE_LABELS[i]}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>商品情報</h2>
        <dl className={styles.dl}>
          <dt>タイトル</dt>
          <dd>{formData.title}</dd>
          <dt>説明</dt>
          <dd className={styles.description}>{formData.description}</dd>
          <dt>価格</dt>
          <dd>{formData.price.toLocaleString()} 円</dd>
          <dt>カテゴリ</dt>
          <dd>{formData.categoryName}</dd>
        </dl>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>AI 傷検出結果</h2>
        {state.detectionStatus === 'waiting' && (
          <p className={styles.statusWaiting}>検出中です。しばらくお待ちください...</p>
        )}
        {state.detectionStatus === 'failed' && (
          <p className={styles.statusFailed}>
            傷検出に失敗しています。
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => navigate('/listing/upload')}
            >
              再アップロードしてください
            </button>
          </p>
        )}
        {state.detectionStatus === 'complete' && state.condition && (
          <dl className={styles.dl}>
            <dt>状態</dt>
            <dd>{CONDITION_LABELS[state.condition]}</dd>
            <dt>AI コメント</dt>
            <dd>{state.conditionNote}</dd>
            <dt>検出された傷</dt>
            <dd>{state.damages.length} 件</dd>
          </dl>
        )}
      </section>

      {submitError && <p className={styles.error}>{submitError}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => navigate('/listing/info')}
          disabled={isSubmitting}
        >
          戻る
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!isReadyToSubmit || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          {isSubmitting ? '出品中...' : '出品する'}
        </button>
      </div>
    </div>
  )
}
