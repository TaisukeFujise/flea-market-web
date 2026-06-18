import { useReducer, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUpload } from '../../utils/api'
import type { ImageUploadResponse } from '../../utils/types'
import { useListingContext } from './ListingContext'
import { ANGLES, ANGLE_LABELS } from './listingConstants'
import styles from './UploadPage.module.css'

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

type UploadState = {
  capturedFiles: (File | null)[]
  selectedAngleIndex: number
  isUploading: boolean
  error: string | null
}

type UploadAction =
  | { type: 'SELECT_ANGLE'; index: number }
  | { type: 'FILE_SELECTED'; index: number; file: File }
  | { type: 'PHOTO_TAKEN'; index: number; file: File }
  | { type: 'UPLOAD_START' }
  | { type: 'UPLOAD_ERROR'; error: string }
  | { type: 'CAMERA_ERROR'; error: string }

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'SELECT_ANGLE':
      return { ...state, selectedAngleIndex: action.index }
    case 'FILE_SELECTED':
      return {
        ...state,
        capturedFiles: state.capturedFiles.map((f, i) => (i === action.index ? action.file : f)),
        error: null,
      }
    case 'PHOTO_TAKEN': {
      const newFiles = state.capturedFiles.map((f, i) =>
        i === action.index ? action.file : f,
      )
      // 撮影後、次の未撮影角度へ自動移動
      let nextIndex = -1
      for (let offset = 1; offset <= 5; offset++) {
        const idx = (action.index + offset) % 5
        if (newFiles[idx] === null) { nextIndex = idx; break }
      }
      return {
        ...state,
        capturedFiles: newFiles,
        selectedAngleIndex: nextIndex !== -1 ? nextIndex : action.index,
        error: null,
      }
    }
    case 'UPLOAD_START':
      return { ...state, isUploading: true, error: null }
    case 'UPLOAD_ERROR':
      return { ...state, isUploading: false, error: action.error }
    case 'CAMERA_ERROR':
      return { ...state, error: action.error }
    default:
      return state
  }
}

const initialUploadState: UploadState = {
  capturedFiles: [null, null, null, null, null],
  selectedAngleIndex: 0,
  isUploading: false,
  error: null,
}

export default function UploadPage() {
  const navigate = useNavigate()
  const { dispatch: listingDispatch } = useListingContext()
  const [state, dispatch] = useReducer(uploadReducer, initialUploadState)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([null, null, null, null, null])
  const urlsForCleanupRef = useRef<(string | null)[]>([null, null, null, null, null])

  const capturedCount = state.capturedFiles.filter(f => f !== null).length
  const allCaptured = capturedCount === 5

  function setPreviewUrl(index: number, url: string | null) {
    const old = urlsForCleanupRef.current[index]
    if (old) URL.revokeObjectURL(old)
    urlsForCleanupRef.current[index] = url
    setPreviewUrls(prev => prev.map((u, i) => (i === index ? url : u)))
  }

  useEffect(() => {
    const ref = urlsForCleanupRef
    return () => { ref.current.forEach(url => { if (url) URL.revokeObjectURL(url) }) }
  }, [])

  // モバイルのみ: マウント時にカメラ即起動
  useEffect(() => {
    if (!isMobile) return
    const videoEl = videoRef.current
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoEl) videoEl.srcObject = stream
      } catch {
        if (!cancelled) dispatch({ type: 'CAMERA_ERROR', error: 'カメラへのアクセスができません。' })
      }
    }

    void startCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      if (videoEl) videoEl.srcObject = null
    }
  }, [])

  function capturePhoto() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return
    const angleIndex = state.selectedAngleIndex
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const angle = ANGLES[angleIndex]
      const file = new File([blob], `${angle}.jpg`, { type: 'image/jpeg' })
      setPreviewUrl(angleIndex, URL.createObjectURL(file))
      dispatch({ type: 'PHOTO_TAKEN', index: angleIndex, file })
    }, 'image/jpeg', 0.9)
  }

  function handleFileSelected(index: number, file: File) {
    setPreviewUrl(index, URL.createObjectURL(file))
    dispatch({ type: 'FILE_SELECTED', index, file })
  }

  async function handleUpload() {
    dispatch({ type: 'UPLOAD_START' })
    const formData = new FormData()
    ANGLES.forEach((angle, i) => {
      const file = state.capturedFiles[i]!
      formData.append(angle, file, file.name)
    })
    try {
      const res = await apiUpload<ImageUploadResponse>('/api/images', formData)
      listingDispatch({
        type: 'UPLOAD_COMPLETE',
        imageIds: res.image_ids,
        capturedUrls: previewUrls.filter((u): u is string => u !== null),
      })
      navigate('/listing/info')
    } catch {
      dispatch({ type: 'UPLOAD_ERROR', error: '画像のアップロードに失敗しました。もう一度お試しください。' })
    }
  }

  // ===== モバイル =====
  if (isMobile) {
    return (
      <div className={styles.mobileContainer}>
        {state.error && <p className={styles.error}>{state.error}</p>}

        <div className={styles.cameraCard}>
          <video ref={videoRef} autoPlay playsInline muted className={styles.video} />
          <div className={styles.guideOverlay} />
          <p className={styles.currentAngleLabel}>
            {ANGLE_LABELS[ANGLES[state.selectedAngleIndex]]}
          </p>
          <button
            type="button"
            className={styles.shutterButton}
            onClick={capturePhoto}
            aria-label="撮影"
          />
        </div>

        <div className={styles.angleStrip}>
          {ANGLES.map((angle, i) => (
            <button
              key={angle}
              type="button"
              className={`${styles.angleSlotButton} ${i === state.selectedAngleIndex ? styles.angleSlotActive : ''}`}
              onClick={() => dispatch({ type: 'SELECT_ANGLE', index: i })}
            >
              {previewUrls[i] ? (
                <img src={previewUrls[i]!} alt={ANGLE_LABELS[angle]} className={styles.slotThumbnail} />
              ) : (
                <span className={styles.cameraIcon}>◎</span>
              )}
              <span className={styles.slotLabel}>{ANGLE_LABELS[angle]}</span>
            </button>
          ))}
        </div>

        <div className={styles.mobileActions}>
          <button type="button" className={styles.cancelButton} onClick={() => navigate('/')}>
            キャンセル
          </button>
          <div className={styles.nextGroup}>
            {!allCaptured && (
              <span className={styles.remainingText}>あと {5 - capturedCount} 方向</span>
            )}
            <button
              type="button"
              className={styles.nextButton}
              disabled={!allCaptured || state.isUploading}
              onClick={() => void handleUpload()}
            >
              {state.isUploading ? '送信中...' : '次へ →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ===== PC =====
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>商品を撮影する</h1>
      <p className={styles.description}>5方向から商品を撮影してください。AIが傷を検出します。</p>

      {state.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.pcGrid}>
        {ANGLES.map((angle, i) => (
          <div key={angle} className={styles.pcSlot}>
            <label className={styles.pcSlotLabel} htmlFor={`file-${angle}`}>
              {ANGLE_LABELS[angle]}
            </label>
            {previewUrls[i] ? (
              <img src={previewUrls[i]!} alt={ANGLE_LABELS[angle]} className={styles.preview} />
            ) : (
              <div className={styles.emptySlot}>未選択</div>
            )}
            <input
              id={`file-${angle}`}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(i, file)
              }}
            />
          </div>
        ))}
      </div>

      <div className={styles.pcActions}>
        <button
          className={styles.primaryButton}
          disabled={!allCaptured || state.isUploading}
          onClick={() => void handleUpload()}
        >
          {state.isUploading ? 'アップロード中...' : 'アップロードして次へ'}
        </button>
      </div>
    </div>
  )
}
