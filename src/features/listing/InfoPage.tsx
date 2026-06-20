import { useState, useEffect } from 'react'
import { useNavigate, Navigate, useLoaderData } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useListingContext } from './ListingContext'
import { CONDITION_LABELS } from './listingConstants'
import type { InfoLoaderData } from './infoLoader'
import styles from './InfoPage.module.css'

const DAMAGE_TYPE_LABELS: Record<string, string> = {
  scratch: '傷',
  dirt: '汚れ',
  wear: '使用感',
}

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

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>商品情報を入力</h1>

      <section className={styles.detectionSection}>
        <h2 className={styles.sectionTitle}>AI 傷検出</h2>

        {state.detectionStatus === 'waiting' && (
          <div className={styles.detectingState}>
            <p>AI が傷を検出中...</p>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarIndeterminate} />
            </div>
          </div>
        )}

        {state.detectionStatus === 'complete' && state.condition && (
          <div className={styles.completeState}>
            <p>
              <strong>状態：</strong>
              {CONDITION_LABELS[state.condition]}
            </p>
            <p className={styles.conditionNote}>{state.conditionNote}</p>
            <p>
              <strong>{state.damages.length} 件</strong>の傷を検出
            </p>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => setIsDamagesModalOpen(true)}
            >
              傷の詳細を見る
            </button>
          </div>
        )}

        {state.detectionStatus === 'failed' && (
          <div className={styles.failedState}>
            <p>傷の検出に失敗しました。再アップロードしてください。</p>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => navigate('/listing/upload')}
            >
              Step 1 に戻る
            </button>
          </div>
        )}
      </section>

      <form className={styles.form} onSubmit={e => void handleSubmit(onSubmit)(e)}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="title">
            タイトル <span className={styles.required}>*</span>
          </label>
          <input
            id="title"
            className={styles.input}
            type="text"
            placeholder="例：Sony WH-1000XM5"
            {...register('title', { required: 'タイトルを入力してください' })}
          />
          {errors.title && <p className={styles.fieldError}>{errors.title.message}</p>}
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

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="price">
            価格（円） <span className={styles.required}>*</span>
          </label>
          <input
            id="price"
            className={styles.input}
            type="number"
            min="1"
            placeholder="25000"
            {...register('price', {
              required: '価格を入力してください',
              min: { value: 1, message: '1円以上を入力してください' },
            })}
          />
          {errors.price && <p className={styles.fieldError}>{errors.price.message}</p>}
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

        <div className={styles.formActions}>
          <button type="submit" className={styles.primaryButton}>
            確認画面へ
          </button>
        </div>
      </form>

      {isDamagesModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsDamagesModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>傷の詳細</h2>
            {state.damages.length === 0 ? (
              <p>傷は検出されませんでした。</p>
            ) : (
              <ul className={styles.damageList}>
                {state.damages.map((d, i) => (
                  <li key={i} className={styles.damageItem}>
                    <div className={styles.damageImageWrapper}>
                      <img
                        src={d.image_url}
                        alt={`傷 ${i + 1}`}
                        className={styles.damageImage}
                      />
                      {d.bbox_x1 != null && d.bbox_y1 != null && d.bbox_x2 != null && d.bbox_y2 != null && (
                        <div
                          className={styles.bboxOverlay}
                          style={{
                            '--bbox-left': `${d.bbox_x1 / 10}%`,
                            '--bbox-top': `${d.bbox_y1 / 10}%`,
                            '--bbox-width': `${(d.bbox_x2 - d.bbox_x1) / 10}%`,
                            '--bbox-height': `${(d.bbox_y2 - d.bbox_y1) / 10}%`,
                          } as React.CSSProperties}
                        />
                      )}
                    </div>
                    <strong>{DAMAGE_TYPE_LABELS[d.damage_type] ?? d.damage_type}</strong>
                    {d.description && <span>{d.description}</span>}
                  </li>
                ))}
              </ul>
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
