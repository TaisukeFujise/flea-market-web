import { Outlet } from 'react-router-dom'
import Header from './Header'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.root}>
      <Header />
      <div className={styles.body}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
