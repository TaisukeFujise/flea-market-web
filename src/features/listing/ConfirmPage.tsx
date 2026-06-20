import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import type { ProductCreateResponse } from '../../utils/types'
import { useListingContext } from './ListingContext'
import { ANGLES, ANGLE_LABELS, CONDITION_LABELS, DAMAGE_TYPE_LABELS } from './listingConstants'
import styles from './ConfirmPage.module.css'

const DAMAGE_TYPES = ['scratch', 'dirt', 'wear'] as const

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
      navigate('/listing/complete')
    } catch (err) {
      if (err instanceof Response && err.status === 400) {
        setSubmitError('傷検出が完了していません。しばらく待ってから再度お試しください。')
      } else {
        setSubmitError('出品に失敗しました。もう一度お試しください。')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const damagesByType = Object.fromEntries(
    DAMAGE_TYPES.map(type => [type, state.damages.filter(d => d.damage_type === type)])
  ) as Record<typeof DAMAGE_TYPES[number], typeof state.damages>

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>出品内容を確認</h1>
        <p className={styles.subtext}>内容をご確認の上、出品してください。</p>
      </div>

      <div className={styles.topGrid}>
        {/* 商品画像 */}
        <div className={styles.imageSection}>
          <h2 className={styles.sectionTitle}>商品画像</h2>
          {state.capturedUrls.length > 0 && (
            <>
              <div className={styles.mainImageWrapper}>
                <img
                  src={state.capturedUrls[selectedImageIndex]}
                  alt={ANGLE_LABELS[ANGLES[selectedImageIndex]]}
                  className={styles.mainImage}
                />
              </div>
              <div className={styles.thumbnailStrip}>
                {state.capturedUrls.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.thumbnailButton} ${i === selectedImageIndex ? styles.thumbnailActive : ''}`}
                    onClick={() => setSelectedImageIndex(i)}
                  >
                    <img src={url} alt={ANGLE_LABELS[ANGLES[i]]} className={styles.thumbnail} />
                    <span className={styles.angleLabel}>{ANGLE_LABELS[ANGLES[i]]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 商品情報 */}
        <div className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>商品情報</h2>
          <dl className={styles.infoList}>
            <div className={styles.infoRow}>
              <dt className={styles.infoLabel}>タイトル</dt>
              <dd className={styles.infoValue}>{formData.title}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt className={styles.infoLabel}>カテゴリ</dt>
              <dd className={styles.infoValue}>{formData.categoryName}</dd>
            </div>
            {state.condition && (
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>状態</dt>
                <dd className={styles.infoValue}>
                  <span className={styles.conditionBadge} data-condition={state.condition}>
                    {CONDITION_LABELS[state.condition]}
                  </span>
                </dd>
              </div>
            )}
            <div className={styles.infoRow}>
              <dt className={styles.infoLabel}>価格</dt>
              <dd className={styles.infoValue}>¥{formData.price.toLocaleString()}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt className={styles.infoLabel}>説明</dt>
              <dd className={`${styles.infoValue} ${styles.descriptionValue}`}>{formData.description}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* AI コンディションレポート */}
      <div className={styles.aiSection}>
        <h2 className={styles.sectionTitle}>AIコンディションレポート</h2>

        {state.detectionStatus === 'waiting' && (
          <p className={styles.statusNote}>AI が傷を検出中です。しばらくお待ちください...</p>
        )}
        {state.detectionStatus === 'failed' && (
          <p className={styles.statusError}>傷検出に失敗しました。</p>
        )}

        {state.detectionStatus === 'complete' && (
          <div className={styles.aiGrid}>
            <div className={styles.damageRows}>
              {DAMAGE_TYPES.map(type => {
                const detected = damagesByType[type].length > 0
                return (
                  <div key={type} className={styles.damageRow}>
                    <span className={styles.damageTypeLabel}>{DAMAGE_TYPE_LABELS[type]}</span>
                    <span className={detected ? styles.detectedBadge : styles.notDetectedBadge}>
                      {detected ? '有り' : '検出なし'}
                    </span>
                  </div>
                )
              })}
            </div>
            {state.conditionNote && (
              <div className={styles.aiCommentBox}>
                <p className={styles.aiCommentTitle}>AIコメント</p>
                <p className={styles.aiCommentText}>{state.conditionNote}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {submitError && <p className={styles.submitError}>{submitError}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate('/listing/info')}
          disabled={isSubmitting}
        >
          ← 戻る
        </button>
        <div className={styles.submitGroup}>
          <p className={styles.submitNote}>※出品後は、連絡なく値下げ・取引が可能です。</p>
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
    </div>
  )
}
