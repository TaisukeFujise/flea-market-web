import { useState } from 'react'
import { useLoaderData, useNavigation, useActionData, Form, Link, useNavigate, useParams } from 'react-router-dom'
import Avatar from '../../components/atoms/Avatar'
import type { FeedbackLoaderData } from './feedbackLoader'
import type { FeedbackActionData } from './feedbackAction'
import styles from './FeedbackPage.module.css'

const STARS = [1, 2, 3, 4, 5] as const
const RATING_LABELS: Record<number, string> = {
  1: '悪かった',
  2: 'やや悪かった',
  3: '普通',
  4: '良かった',
  5: 'とても良かった',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export default function FeedbackPage() {
  const { order } = useLoaderData() as FeedbackLoaderData
  const actionData = useActionData() as FeedbackActionData | undefined
  const navigation = useNavigation()
  const navigate = useNavigate()
  const { id: orderId } = useParams<{ id: string }>()

  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className={styles.container}>
      {/* ブレッドクラム */}
      <nav className={styles.breadcrumb}>
        <Link to="/mypage/trades" className={styles.breadcrumbLink}>取引中一覧</Link>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <span>フィードバック</span>
      </nav>

      {/* ページヘッダー */}
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>取引の評価をお願いします</h1>
        <p className={styles.subtext}>お取引が完了しました。いただいた評価はご確認ください。</p>
      </div>

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
          <p className={styles.productDate}>発売日時: {formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* 取引相手 */}
      <div className={styles.counterpartRow}>
        <Avatar
          src={order.counterpart.avatar_url}
          name={order.counterpart.display_name}
          size="sm"
        />
        <span className={styles.counterpartName}>{order.counterpart.display_name}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          className={styles.chevron}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      {/* 傷報告 */}
      <div className={styles.damageSection}>
        <p className={styles.sectionLabel}>AIが見落とした傷の報告</p>
        <p className={styles.sectionDesc}>商品に気になる傷を発見した場合は報告してください。複数回報告できます。</p>
        <Link to={`/orders/${orderId}/damage-report`} className={styles.damageReportButton}>
          傷を報告する
        </Link>
      </div>

      {/* 評価フォーム */}
      <Form method="post" className={styles.form}>
        <input type="hidden" name="score" value={selectedScore ?? ''} />

        <section className={styles.section}>
          <p className={styles.sectionLabel}>このお取引の評価</p>
          <div className={styles.stars}>
            {STARS.map(star => (
              <button
                key={star}
                type="button"
                className={`${styles.starButton} ${selectedScore !== null && star <= selectedScore ? styles.starFilled : ''}`}
                onClick={() => setSelectedScore(star)}
                aria-label={`${star}点`}
              >
                ★
              </button>
            ))}
          </div>
          {selectedScore !== null && (
            <p className={styles.ratingLabel}>{RATING_LABELS[selectedScore]}</p>
          )}
          {actionData?.error && <p className={styles.fieldError}>{actionData.error}</p>}
        </section>

        <div className={styles.infoNote}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <p className={styles.infoNoteText}>
            いただいたフィードバックは、今後のサービス改善の参考にさせていただきます。
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.skipButton}
            onClick={() => navigate('/mypage/trades')}
            disabled={isSubmitting}
          >
            スキップ
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={selectedScore === null || isSubmitting}
          >
            {isSubmitting ? '送信中...' : 'フィードバックを送信'}
          </button>
        </div>
      </Form>
    </div>
  )
}
