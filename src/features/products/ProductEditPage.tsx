import { useReducer, useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router-dom'
import type { ProductEditLoaderData } from './productEditLoader'
import { apiFetch } from '../../utils/api'
import ConfirmModal from '../../components/atoms/ConfirmModal'
import styles from './ProductEditPage.module.css'

type EditState = {
  title: string
  description: string
  price: string
  loading: boolean
  error: string | null
  success: boolean
}

type EditAction =
  | { type: 'set_title'; value: string }
  | { type: 'set_description'; value: string }
  | { type: 'set_price'; value: string }
  | { type: 'submit' }
  | { type: 'submit_done' }
  | { type: 'submit_error'; message: string }

function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case 'set_title':
      return { ...state, title: action.value, success: false }
    case 'set_description':
      return { ...state, description: action.value, success: false }
    case 'set_price':
      return { ...state, price: action.value, success: false }
    case 'submit':
      return { ...state, loading: true, error: null, success: false }
    case 'submit_done':
      return { ...state, loading: false, success: true }
    case 'submit_error':
      return { ...state, loading: false, error: action.message }
  }
}

export default function ProductEditPage() {
  const { product } = useLoaderData() as ProductEditLoaderData
  const navigate = useNavigate()

  const [form, dispatchForm] = useReducer(editReducer, {
    title: product.title,
    description: product.description,
    price: String(product.price),
    loading: false,
    error: null,
    success: false,
  })

  const [slide, setSlide] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleSave() {
    const price = Number(form.price)
    if (!form.title.trim() || isNaN(price) || price <= 0) {
      dispatchForm({ type: 'submit_error', message: 'タイトルと価格（1円以上）を入力してください' })
      return
    }
    dispatchForm({ type: 'submit' })
    try {
      await apiFetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price,
        }),
      })
      dispatchForm({ type: 'submit_done' })
    } catch {
      dispatchForm({ type: 'submit_error', message: '更新に失敗しました' })
    }
  }

  async function handleDelete() {
    setShowDeleteModal(false)
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await apiFetch(`/api/products/${product.id}`, { method: 'DELETE' })
      navigate('/mypage/listing')
    } catch {
      setDeleteError('削除に失敗しました')
      setDeleteLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <p className={styles.breadcrumb}>出品中</p>
      <h1 className={styles.title}>商品を編集</h1>

      <div className={styles.mainGrid}>
        {/* Gallery column */}
        <div className={styles.galleryCol}>
          <div className={styles.sliderWrapper}>
            <button
              type="button"
              className={styles.sliderBtn}
              onClick={() => setSlide(s => s - 1)}
              disabled={slide === 0}
              aria-label="前の画像"
            >
              ‹
            </button>
            <div className={styles.imageContainer}>
              {product.images[slide] && (
                <img
                  key={product.images[slide].id}
                  src={product.images[slide].url}
                  alt={product.title}
                  className={styles.mainImage}
                />
              )}
            </div>
            <button
              type="button"
              className={styles.sliderBtn}
              onClick={() => setSlide(s => s + 1)}
              disabled={slide >= product.images.length - 1}
              aria-label="次の画像"
            >
              ›
            </button>
          </div>

          {product.images.length > 1 && (
            <div className={styles.thumbnails}>
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  className={`${styles.thumbnail} ${i === slide ? styles.thumbnailActive : ''}`}
                  onClick={() => setSlide(i)}
                  aria-label={img.angle}
                >
                  <img src={img.url} alt={img.angle} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form column */}
        <div className={styles.formCol}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">タイトル</label>
            <input
              id="title"
              className={styles.input}
              value={form.title}
              onChange={e => dispatchForm({ type: 'set_title', value: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="price">価格（円）</label>
            <input
              id="price"
              type="number"
              className={styles.input}
              value={form.price}
              min={1}
              onChange={e => dispatchForm({ type: 'set_price', value: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">説明</label>
            <textarea
              id="description"
              className={styles.textarea}
              value={form.description}
              onChange={e => dispatchForm({ type: 'set_description', value: e.target.value })}
              rows={8}
            />
          </div>

          {form.error && <p className={styles.error}>{form.error}</p>}
          {form.success && <p className={styles.success}>保存しました</p>}
        </div>
      </div>

      {/* Action row */}
      <div className={styles.actionRow}>
        <div>
          {deleteError && <p className={styles.error}>{deleteError}</p>}
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => setShowDeleteModal(true)}
            disabled={deleteLoading}
          >
            {deleteLoading ? '削除中...' : '出品を取り下げる'}
          </button>
        </div>
        <div className={styles.primaryActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate('/mypage/listing')}
          >
            キャンセル
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={form.loading}
          >
            {form.loading ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmModal
          title="商品を削除しますか？"
          description="削除すると元に戻せません。"
          confirmLabel="削除する"
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
