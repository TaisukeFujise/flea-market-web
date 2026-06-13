import { useLoaderData } from 'react-router-dom'
import type { Product, Paginated } from '../../utils/types'

export default function HomePage() {
  const { items, total } = useLoaderData() as Paginated<Product>

  return (
    <div>
      <h1>商品一覧（{total}件）</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {items.map(product => (
          <a key={product.id} href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={product.thumbnail_url} alt={product.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
              <div style={{ padding: '8px' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{product.title}</p>
                <p style={{ margin: 0 }}>¥{product.price.toLocaleString()}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{product.condition}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
