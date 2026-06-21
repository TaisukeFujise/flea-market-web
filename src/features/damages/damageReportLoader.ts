import type { LoaderFunctionArgs } from 'react-router-dom'
import { redirect } from 'react-router-dom'
import { apiFetch } from '../../utils/api'
import { protectedLoader } from '../../utils/auth'
import type { OrderDetail, ProductDetail, ProductImage } from '../../utils/types'

export type DamageReportLoaderData = {
  order: OrderDetail
  productImages: ProductImage[]
}

export async function damageReportLoader({ params }: LoaderFunctionArgs): Promise<DamageReportLoaderData | Response> {
  const authRedirect = await protectedLoader()
  if (authRedirect) return authRedirect

  const order = await apiFetch<OrderDetail>(`/api/orders/${params.id!}`)
  if (order.status !== 'completed') {
    return redirect(`/orders/${params.id!}`)
  }

  const productImages = await apiFetch<ProductDetail>(`/api/products/${order.product.id}`)
    .then(p => p.images)
    .catch((): ProductImage[] => [])

  return { order, productImages }
}
