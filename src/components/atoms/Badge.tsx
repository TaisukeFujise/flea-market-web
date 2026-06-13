import styles from './Badge.module.css'
import type { Product } from '../../utils/types'

type ConditionVariant = Product['condition']
type StatusVariant = Product['status']
type Variant = ConditionVariant | StatusVariant | 'default'

const CONDITION_LABELS: Record<ConditionVariant, string> = {
  good: '良好',
  fair: '普通',
  poor: '傷あり',
}

const STATUS_LABELS: Record<StatusVariant, string> = {
  on_sale: '販売中',
  sold_out: '売り切れ',
}

type Props = {
  variant: Variant
  label?: string
  className?: string
}

export default function Badge({ variant, label, className }: Props) {
  const displayLabel =
    label ??
    (variant in CONDITION_LABELS
      ? CONDITION_LABELS[variant as ConditionVariant]
      : variant in STATUS_LABELS
        ? STATUS_LABELS[variant as StatusVariant]
        : variant)

  return (
    <span className={[styles.badge, styles[variant], className].filter(Boolean).join(' ')}>
      {displayLabel}
    </span>
  )
}
