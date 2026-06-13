import styles from './Avatar.module.css'

type Size = 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  src?: string | null
  name?: string | null
  size?: Size
  className?: string
}

export default function Avatar({ src, name, size = 'md', className }: Props) {
  const initial = (name?.[0] ?? '?').toUpperCase()
  const sizeClass = styles[size]

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={[styles.avatar, sizeClass, className].filter(Boolean).join(' ')}
      />
    )
  }

  return (
    <span className={[styles.fallback, sizeClass, className].filter(Boolean).join(' ')}>
      {initial}
    </span>
  )
}
