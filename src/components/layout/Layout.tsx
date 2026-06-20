import { Outlet } from 'react-router-dom'
import Header from './Header'
import CategoryNav from './CategoryNav'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.root}>
      <Header />
      <CategoryNav />
      <div className={styles.body}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
