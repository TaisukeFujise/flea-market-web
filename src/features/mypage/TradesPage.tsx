import { useLoaderData, useNavigate } from 'react-router-dom'
import type { TradesLoaderData } from './tradesLoader'
import styles from './TradesPage.module.css'

const STATUS_LABEL: Record<string, string> = {
  buyer: '受け取り待ち',
  seller: '発送待ち',
}

export default function TradesPage() {
  const { orders } = useLoaderData() as TradesLoaderData
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <p className={styles.breadcrumb}>マイページ</p>
      <h1 className={styles.title}>取引中</h1>
      <p className={styles.count}>{orders.length}件の進行中の取引</p>
      <ul className={styles.list}>
        {orders.map(order => (
          <li
            key={order.id}
            className={styles.item}
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <img
              src={order.product.thumbnail_url}
              alt={order.product.title}
              className={styles.thumbnail}
            />
            <div className={styles.info}>
              <div className={styles.titleRow}>
                <span className={`${styles.badge} ${order.role === 'buyer' ? styles.badgeBuyer : styles.badgeSeller}`}>
                  {order.role === 'buyer' ? '購入' : '出品'}
                </span>
                <span className={styles.productTitle}>{order.product.title}</span>
              </div>
              <div className={styles.meta}>
                <img
                  src={order.counterpart.avatar_url}
                  alt={order.counterpart.display_name}
                  className={styles.counterpartAvatar}
                />
                <span className={styles.counterpartName}>{order.counterpart.display_name}</span>
                <span className={styles.date}>
                  · {new Date(order.created_at).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                </span>
              </div>
            </div>
            <span className={styles.status}>{STATUS_LABEL[order.role]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
