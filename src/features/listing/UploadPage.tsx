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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([null, null, null, null, null])
  const urlsForCleanupRef = useRef<(string | null)[]>([null, null, null, null, null])
  const [isDragOver, setIsDragOver] = useState(false)

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

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelected(state.selectedAngleIndex, file)
    }
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
      urlsForCleanupRef.current = [null, null, null, null, null]
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
              <div className={styles.slotThumbnailWrapper}>
                {previewUrls[i] ? (
                  <img src={previewUrls[i]!} alt={ANGLE_LABELS[angle]} className={styles.slotThumbnail} />
                ) : (
                  <span className={styles.cameraIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </span>
                )}
              </div>
              <span className={styles.slotLabel}>{ANGLE_LABELS[angle]}</span>
            </button>
          ))}
        </div>

        <div className={styles.mobileActions}>
          <button type="button" className={styles.cancelButton} onClick={() => navigate('/')}>
            キャンセル
          </button>
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
    )
  }

  // ===== PC =====
  return (
    <div className={styles.container}>
      {state.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.pcLayout}>
        {/* 左列: 見出し + 説明 + アップロードエリア */}
        <div className={styles.leftColumn}>
          <h1 className={styles.heading}>商品を撮影する</h1>
          <p className={styles.description}>5方向から撮影してください。AIが傷を検出します。</p>

          <div
            className={`${styles.dropzone} ${isDragOver ? styles.dropzoneOver : ''}`}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <svg className={styles.dropzoneIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <button
              type="button"
              className={styles.fileSelectButton}
              onClick={() => fileInputRef.current?.click()}
            >
              ファイルを選ぶ
            </button>
            <span className={styles.dropzoneHint}>またはドラッグ&ドロップ</span>
            <span className={styles.dropzoneFormat}>JPG、PNG（最大 20MB）</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(state.selectedAngleIndex, file)
                e.target.value = ''
              }}
            />
          </div>
        </div>

        {/* 右列: プレビュー */}
        <div className={styles.rightColumn}>
          <div className={styles.previewArea}>
            {previewUrls[state.selectedAngleIndex] ? (
              <img
                src={previewUrls[state.selectedAngleIndex]!}
                alt={ANGLE_LABELS[ANGLES[state.selectedAngleIndex]]}
                className={styles.previewImage}
              />
            ) : (
              <div className={styles.previewEmpty}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
          </div>

          <div className={styles.pcAngleStrip}>
            {ANGLES.map((angle, i) => (
              <button
                key={angle}
                type="button"
                className={`${styles.pcAngleButton} ${i === state.selectedAngleIndex ? styles.pcAngleButtonActive : ''}`}
                onClick={() => dispatch({ type: 'SELECT_ANGLE', index: i })}
              >
                <div className={styles.pcAngleThumbnail}>
                  {previewUrls[i] ? (
                    <img src={previewUrls[i]!} alt={ANGLE_LABELS[angle]} className={styles.pcAngleThumbnailImg} />
                  ) : (
                    <div className={styles.pcAngleThumbnailEmpty} />
                  )}
                </div>
                <span className={styles.pcAngleLabel}>{ANGLE_LABELS[angle]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.pcActions}>
        <button type="button" className={styles.cancelButton} onClick={() => navigate('/')}>
          キャンセル
        </button>
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
  )
}
