import { Outlet, useLocation } from 'react-router-dom'
import styles from './ListingLayout.module.css'

const STEPS = [
  { segment: 'upload', label: '撮影' },
  { segment: 'info', label: '商品情報' },
  { segment: 'confirm', label: '確認' },
]

const STEP_INDEX: Record<string, number> = { upload: 0, info: 1, confirm: 2 }

export default function ListingLayout() {
  const { pathname } = useLocation()
  const segment = pathname.split('/').at(-1) ?? ''
  const currentStep = STEP_INDEX[segment] ?? -1

  return (
    <div className={styles.container}>
      {currentStep >= 0 && (
        <nav className={styles.stepper} aria-label="出品ステップ">
          {STEPS.map((step, i) => (
            <div
              key={step.segment}
              className={[
                styles.step,
                i < currentStep ? styles.done : '',
                i === currentStep ? styles.active : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.stepNumber}>{i + 1}</span>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
          ))}
        </nav>
      )}
      <Outlet />
    </div>
  )
}
