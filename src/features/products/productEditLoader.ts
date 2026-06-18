import type { LoaderFunctionArgs } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { ProductDetail } from '../../utils/types'

export type ProductEditLoaderData = {
  product: ProductDetail
}

export async function productEditLoader({ params }: LoaderFunctionArgs): Promise<ProductEditLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const product = await apiFetch<ProductDetail>(`/api/products/${params.id}`)
  return { product }
}
