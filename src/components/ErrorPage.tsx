import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import styles from './ErrorPage.module.css'

export default function ErrorPage() {
  const error = useRouteError()

  let status: number | undefined
  let message: string

  if (isRouteErrorResponse(error)) {
    status = error.status
    message = error.statusText || error.data as string
  } else if (error instanceof Error) {
    message = error.message
  } else {
    message = String(error)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        {status ? `${status} エラー` : 'エラーが発生しました'}
      </h1>
      <p className={styles.message}>{message}</p>
      <Link to="/">ホームに戻る</Link>
    </div>
  )
}
