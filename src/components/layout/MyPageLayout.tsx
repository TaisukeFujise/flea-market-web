import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import styles from './MyPageLayout.module.css'

export default function MyPageLayout() {
  return (
    <>
      <Sidebar />
      <div className={styles.content}>
        <Outlet />
      </div>
    </>
  )
}
