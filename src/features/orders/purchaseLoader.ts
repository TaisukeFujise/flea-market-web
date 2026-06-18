import { redirect } from 'react-router-dom'
import type { LoaderFunctionArgs } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import type { ProductDetail } from '../../utils/types'

export type PurchaseLoaderData = {
  product: ProductDetail
}

export async function purchaseLoader({ params }: LoaderFunctionArgs): Promise<PurchaseLoaderData> {
  const token = localStorage.getItem('token')
  if (!token) return redirect('/login') as never
  const product = await apiFetch<ProductDetail>(`/api/products/${params.id}`)
  return { product }
}
