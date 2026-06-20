import { useState, useEffect } from 'react'
import { useNavigate, Navigate, useLoaderData } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useListingContext } from './ListingContext'
import { DAMAGE_TYPE_LABELS } from './listingConstants'
import type { InfoLoaderData } from './infoLoader'
import styles from './InfoPage.module.css'

const DAMAGE_TYPES = ['scratch', 'dirt', 'wear'] as const
const PROCESSING_STEPS = ['画像の解析', '傷の検出', 'レポートの生成'] as const

type FormValues = {
  title: string
  description: string
  price: number
  categoryId: string
}

export default function InfoPage() {
  const navigate = useNavigate()
  const { state, dispatch: listingDispatch } = useListingContext()
  const { categories } = useLoaderData() as InfoLoaderData

  const [isDamagesModalOpen, setIsDamagesModalOpen] = useState(false)
  const [checkedCount, setCheckedCount] = useState(0)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    if (state.detectionStatus !== 'complete') return
    const t1 = setTimeout(() => setCheckedCount(1), 0)
    const t2 = setTimeout(() => setCheckedCount(2), 300)
    const t3 = setTimeout(() => setCheckedCount(3), 600)
    const t4 = setTimeout(() => setShowReport(true), 1000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [state.detectionStatus])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onBlur' })

  useEffect(() => {
    if (state.detectionStatus !== 'waiting' || state.imageIds.length === 0) return

    const elapsed = state.uploadedAt ? Date.now() - state.uploadedAt : 0
    const remaining = Math.max(0, 90_000 - elapsed)

    const timer = setTimeout(() => {
      listingDispatch({ type: 'DETECTION_FAILED' })
    }, remaining)

    return () => clearTimeout(timer)
  }, [state.detectionStatus, state.uploadedAt, state.imageIds.length, listingDispatch])

  if (state.imageIds.length === 0) {
    return <Navigate to="/listing/upload" replace />
  }

  function findCategoryName(id: string): string {
    for (const parent of categories) {
      if (parent.id === id) return parent.name
      for (const child of parent.children) {
        if (child.id === id) return child.name
      }
    }
    return ''
  }

  function onSubmit(data: FormValues) {
    listingDispatch({
      type: 'FORM_SUBMIT',
      formData: {
        title: data.title,
        description: data.description,
        price: Number(data.price),
        categoryId: data.categoryId,
        categoryName: findCategoryName(data.categoryId),
      },
    })
    navigate('/listing/confirm')
  }

  const damagesByType = Object.fromEntries(
    DAMAGE_TYPES.map(type => [type, state.damages.filter(d => d.damage_type === type)])
  ) as Record<typeof DAMAGE_TYPES[number], typeof state.damages>

  const isDetectionComplete = state.detectionStatus === 'complete'

  return (
    <div className={styles.container}>
      <div className={styles.pcLayout}>
        <div className={styles.formColumn}>
          <div className={styles.formHeader}>
            <h1 className={styles.heading}>商品情報を入力</h1>
            <p className={styles.subtext}>AIによる傷の分析が完了したら、内容を確認して必要な情報を入力してください。</p>
          </div>

          <form className={styles.form} onSubmit={e => void handleSubmit(onSubmit)(e)}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="title">
                タイトル <span className={styles.required}>*</span>
              </label>
              <input
                id="title"
                className={styles.input}
                type="text"
                placeholder="例：SONY α6400 ボディ ブラック"
                {...register('title', { required: 'タイトルを入力してください' })}
              />
              {errors.title && <p className={styles.fieldError}>{errors.title.message}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="categoryId">
                カテゴリ <span className={styles.required}>*</span>
              </label>
              <select
                id="categoryId"
                className={styles.select}
                {...register('categoryId', { required: 'カテゴリを選択してください' })}
              >
                <option value="">カテゴリを選択</option>
                {categories.map(parent =>
                  parent.children.length > 0 ? (
                    <optgroup key={parent.id} label={parent.name}>
                      {parent.children.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </optgroup>
                  ) : (
                    <option key={parent.id} value={parent.id}>
                      {parent.name}
                    </option>
                  ),
                )}
              </select>
              {errors.categoryId && <p className={styles.fieldError}>{errors.categoryId.message}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="price">
                価格（円） <span className={styles.required}>*</span>
              </label>
              <input
                id="price"
                className={styles.input}
                type="number"
                min="1"
                placeholder="45000"
                {...register('price', {
                  required: '価格を入力してください',
                  min: { value: 1, message: '1円以上を入力してください' },
                })}
              />
              {errors.price && <p className={styles.fieldError}>{errors.price.message}</p>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="description">
                説明 <span className={styles.required}>*</span>
              </label>
              <textarea
                id="description"
                className={styles.textarea}
                rows={4}
                placeholder="商品の状態や使用期間など"
                {...register('description', { required: '説明を入力してください' })}
              />
              {errors.description && <p className={styles.fieldError}>{errors.description.message}</p>}
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => navigate('/listing/upload')}
              >
                ← 戻る
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={!isDetectionComplete}
              >
                確認画面へ →
              </button>
            </div>
          </form>
        </div>

        <div className={styles.aiPanel}>
          {(state.detectionStatus === 'waiting' || (state.detectionStatus === 'complete' && !showReport)) && (
            <div className={styles.detectingState}>
              <div className={styles.progressRingWrapper}>
                <svg width="120" height="120" viewBox="0 0 100 100" className={styles.progressSvg}>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke="var(--primary)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="276.46"
                    className={styles.progressArc}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className={styles.progressLabel}>AI検出中</span>
              </div>
              <p className={styles.detectingTitle}>AI が傷を検出中...</p>
              <p className={styles.detectingSub}>推定3〜5分以内に完了予定</p>
              <ul className={styles.processingSteps}>
                {PROCESSING_STEPS.map((step, i) => (
                  <li key={step} className={i < checkedCount ? styles.stepChecked : ''}>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.detectionStatus === 'complete' && showReport && (
            <div className={styles.reportState}>
              <h2 className={styles.reportTitle}>AIコンディションレポート</h2>
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
              <button
                type="button"
                className={styles.detailLink}
                onClick={() => setIsDamagesModalOpen(true)}
              >
                詳細を見る
              </button>
            </div>
          )}

          {state.detectionStatus === 'failed' && (
            <div className={styles.failedState}>
              <p className={styles.failedText}>傷の検出に失敗しました。</p>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => navigate('/listing/upload')}
              >
                再アップロード
              </button>
            </div>
          )}
        </div>
      </div>

      {isDamagesModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDamagesModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>AIコンディションレポート</h2>

            <div className={styles.modalRows}>
              {DAMAGE_TYPES.map(type => {
                const damages = damagesByType[type]
                const detected = damages.length > 0
                const firstDamage = damages[0]
                const imageUrl = firstDamage?.image_url ?? state.capturedUrls[0]
                const description = firstDamage?.description
                const hasBbox = firstDamage != null
                  && firstDamage.bbox_x1 != null
                  && firstDamage.bbox_y1 != null
                  && firstDamage.bbox_x2 != null
                  && firstDamage.bbox_y2 != null

                return (
                  <div key={type} className={styles.modalRow}>
                    {imageUrl && (
                      <div className={styles.modalThumbnailWrapper}>
                        <img src={imageUrl} alt={DAMAGE_TYPE_LABELS[type]} className={styles.modalThumbnail} />
                        {hasBbox && (
                          <div
                            className={styles.bboxOverlay}
                            style={{
                              '--bbox-left': `${firstDamage.bbox_x1! / 10}%`,
                              '--bbox-top': `${firstDamage.bbox_y1! / 10}%`,
                              '--bbox-width': `${(firstDamage.bbox_x2! - firstDamage.bbox_x1!) / 10}%`,
                              '--bbox-height': `${(firstDamage.bbox_y2! - firstDamage.bbox_y1!) / 10}%`,
                            } as React.CSSProperties}
                          />
                        )}
                      </div>
                    )}
                    <div className={styles.modalRowInfo}>
                      <div className={styles.modalRowHeader}>
                        <span className={styles.modalDamageType}>{DAMAGE_TYPE_LABELS[type]}</span>
                        <span className={detected ? styles.detectedBadge : styles.notDetectedBadge}>
                          {detected ? '有り' : '検出なし'}
                        </span>
                      </div>
                      {description && <p className={styles.modalRowDesc}>{description}</p>}
                    </div>
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

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setIsDamagesModalOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
