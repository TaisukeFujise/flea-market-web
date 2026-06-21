import { useEffect, useRef, useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router-dom'
import type { DamageReportLoaderData } from './damageReportLoader'
import type { ProductImage } from '../../utils/types'
import styles from './DamageReportPage.module.css'

type Phase = 'select' | 'draw'

type BBox = { x1: number; y1: number; x2: number; y2: number }

type AngleOption = {
  angle: 'front' | 'back' | 'right' | 'left' | 'top'
  label: string
  url: string
}

const ANGLE_MAP: Record<string, string> = {
  front: '正面',
  back: '背面',
  right: '右',
  left: '左',
  top: '上',
}
const ANGLE_ORDER = ['front', 'back', 'right', 'left', 'top'] as const

function buildAngleOptions(images: ProductImage[]): AngleOption[] {
  return ANGLE_ORDER.map(angle => ({
    angle,
    label: ANGLE_MAP[angle],
    url: images.find(i => i.angle === angle)?.url ?? '',
  }))
}

export default function DamageReportPage() {
  const { order, productImages } = useLoaderData() as DamageReportLoaderData
  const navigate = useNavigate()

  const angleOptions = buildAngleOptions(productImages)

  const [phase, setPhase] = useState<Phase>('select')
  const [selected, setSelected] = useState<AngleOption | null>(null)
  const [bbox, setBbox] = useState<BBox | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [liveEnd, setLiveEnd] = useState<{ x: number; y: number } | null>(null)
  const [description, setDescription] = useState('')
  const [showToast, setShowToast] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  function getRelative(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    }
  }

  useEffect(() => {
    if (!isDragging || !dragStart) return

    function onMouseMove(e: MouseEvent) {
      setLiveEnd(getRelative(e.clientX, e.clientY))
    }

    function onMouseUp(e: MouseEvent) {
      const end = getRelative(e.clientX, e.clientY)
      const x1 = Math.min(dragStart!.x, end.x)
      const y1 = Math.min(dragStart!.y, end.y)
      const x2 = Math.max(dragStart!.x, end.x)
      const y2 = Math.max(dragStart!.y, end.y)
      if (x2 - x1 > 0.02 && y2 - y1 > 0.02) {
        setBbox({ x1, y1, x2, y2 })
      }
      setIsDragging(false)
      setDragStart(null)
      setLiveEnd(null)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging, dragStart])

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault()
    setBbox(null)
    const coords = getRelative(e.clientX, e.clientY)
    setDragStart(coords)
    setLiveEnd(coords)
    setIsDragging(true)
  }

  function handleSelectPhoto(option: AngleOption) {
    setSelected(option)
    setBbox(null)
    setDescription('')
    setPhase('draw')
  }

  function handleSubmit() {
    setShowToast(true)
    setTimeout(() => {
      navigate(`/orders/${order.id}/feedback`)
    }, 1600)
  }

  const displayBbox: BBox | null =
    bbox ??
    (isDragging && dragStart && liveEnd
      ? {
          x1: Math.min(dragStart.x, liveEnd.x),
          y1: Math.min(dragStart.y, liveEnd.y),
          x2: Math.max(dragStart.x, liveEnd.x),
          y2: Math.max(dragStart.y, liveEnd.y),
        }
      : null)

  return (
    <div className={styles.container}>
      {showToast && (
        <div className={styles.toast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          傷報告が完了しました
        </div>
      )}

      {/* ブレッドクラム */}
      <nav className={styles.breadcrumb}>
        <Link to="/mypage/trades" className={styles.breadcrumbLink}>取引中一覧</Link>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <Link to={`/orders/${order.id}/feedback`} className={styles.breadcrumbLink}>フィードバック</Link>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <span>傷報告</span>
      </nav>

      {/* 商品情報 */}
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
        </div>
      </div>

      {phase === 'select' && (
        <>
          <div className={styles.pageHeader}>
            <h1 className={styles.heading}>AIが見落とした傷を報告する</h1>
            <p className={styles.subtext}>傷が写っている写真を選んでください。</p>
          </div>

          <div className={styles.infoNote}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--info)' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <p className={styles.infoNoteText}>
              出品時にAIが検出済みの傷を除いて、見落としている傷箇所を報告してください。この報告はAIの精度向上に使用されます。
            </p>
          </div>

          <div>
            <p className={styles.sectionLabel}>報告する写真を選んでください</p>
            <div className={styles.photoGrid}>
              {angleOptions.map(option => (
                <button
                  key={option.angle}
                  type="button"
                  className={styles.photoCard}
                  onClick={() => handleSelectPhoto(option)}
                >
                  <div className={styles.photoCardImageWrap}>
                    {option.url ? (
                      <img src={option.url} alt={option.label} className={styles.photoCardImage} />
                    ) : (
                      <div className={styles.photoCardPlaceholder}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className={styles.photoCardLabel}>{option.label}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {phase === 'draw' && selected && (
        <>
          <div className={styles.pageHeader}>
            <h1 className={styles.heading}>{selected.label}の写真 — 傷箇所を指定</h1>
          </div>

          <button
            type="button"
            className={styles.backButton}
            onClick={() => { setPhase('select'); setBbox(null) }}
          >
            ← 写真を選び直す
          </button>

          <p className={styles.drawInstruction}>
            ドラッグして傷の範囲を囲んでください。範囲を指定してから送信ボタンが有効になります。
          </p>

          {/* 画像 + bbox描画エリア */}
          <div
            ref={containerRef}
            className={styles.imageCanvas}
            onMouseDown={handleMouseDown}
          >
            {selected.url ? (
              <img src={selected.url} alt={selected.label} className={styles.canvasImage} draggable={false} />
            ) : (
              <div className={styles.canvasPlaceholder}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}

            {displayBbox && (
              <div
                className={styles.bboxRect}
                style={{
                  '--bbox-left': `${displayBbox.x1 * 100}%`,
                  '--bbox-top': `${displayBbox.y1 * 100}%`,
                  '--bbox-width': `${(displayBbox.x2 - displayBbox.x1) * 100}%`,
                  '--bbox-height': `${(displayBbox.y2 - displayBbox.y1) * 100}%`,
                } as React.CSSProperties}
              />
            )}
          </div>

          <p className={bbox ? `${styles.bboxStatus} ${styles.bboxStatusSet}` : styles.bboxStatus}>
            {bbox
              ? `範囲を選択しました（${Math.round((bbox.x2 - bbox.x1) * 100)}% × ${Math.round((bbox.y2 - bbox.y1) * 100)}%）。再度ドラッグで描き直せます。`
              : 'まだ範囲が選択されていません。'}
          </p>

          <div>
            <label className={styles.textareaLabel} htmlFor="damage-desc">
              傷の詳細（任意）
            </label>
            <textarea
              id="damage-desc"
              className={styles.textarea}
              placeholder="例：右下角に深い引っ掻き傷があります"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate(`/orders/${order.id}/feedback`)}
            >
              キャンセル
            </button>
            <button
              type="button"
              className={styles.submitButton}
              disabled={bbox === null || showToast}
              onClick={handleSubmit}
            >
              {showToast ? '送信中...' : '傷を報告する'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
