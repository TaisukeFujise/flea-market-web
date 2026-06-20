import { useState } from 'react'
import { useLoaderData, useNavigation, useActionData, Form } from 'react-router-dom'
import Avatar from '../../components/atoms/Avatar'
import Badge from '../../components/atoms/Badge'
import type { FeedbackLoaderData } from './feedbackLoader'
import type { FeedbackActionData } from './feedbackAction'
import styles from './FeedbackPage.module.css'

const STARS = [1, 2, 3, 4, 5] as const

export default function FeedbackPage() {
  const { order } = useLoaderData() as FeedbackLoaderData
  const actionData = useActionData() as FeedbackActionData | undefined
  const navigation = useNavigation()

  const [selectedScore, setSelectedScore] = useState<number | null>(null)

  const isSubmitting = navigation.state === 'submitting'

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>フィードバック</h1>

      <section className={styles.sellerCard}>
        <Avatar
          src={order.counterpart.avatar_url}
          name={order.counterpart.display_name}
          size="lg"
        />
        <div className={styles.sellerInfo}>
          <p className={styles.sellerName}>{order.counterpart.display_name}</p>
          <p className={styles.productTitle}>{order.product.title}</p>
        </div>
        <Badge variant="default" label="受取完了" />
      </section>

      <Form method="post">
        <input type="hidden" name="score" value={selectedScore ?? ''} />

        <section className={styles.ratingSection}>
          <p className={styles.sectionLabel}>取引はいかがでしたか？</p>
          <div className={styles.stars}>
            {STARS.map((star) => (
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
          {actionData?.error && <p className={styles.error}>{actionData.error}</p>}
        </section>

        <section className={styles.damageSection}>
          <p className={styles.sectionLabel}>傷報告</p>
          <p className={styles.damageNote}>
            この報告はAIの精度向上のために使用されます。
          </p>
          {/* TODO: 傷報告フロー実装後に有効化。現時点では未実装のためプレースホルダー */}
          <button type="button" className={styles.damageButton} disabled>
            傷を報告する
          </button>
        </section>

        <p className={styles.caution}>
          フィードバックは送信後に取り消し・再送信できません。
        </p>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={selectedScore === null || isSubmitting}
        >
          {isSubmitting ? '送信中...' : 'フィードバックを送信'}
        </button>
      </Form>
    </div>
  )
}
