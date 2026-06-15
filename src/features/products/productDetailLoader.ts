import type { ProductDetail, Damage, Comment, Paginated } from '../../utils/types'
import { apiFetch } from '../../utils/api'

export type ProductDetailLoaderData = {
  product: ProductDetail
  damages: Damage[]
  comments: Comment[]
}

export async function productDetailLoader({
  params,
}: {
  params: Record<string, string | undefined>
}): Promise<ProductDetailLoaderData> {
  const id = params.id!

  const [product, damagesRes, commentsRes] = await Promise.all([
    apiFetch<ProductDetail>(`/api/products/${id}`),
    apiFetch<{ damages: Damage[] }>(`/api/products/${id}/damages`).catch(() => ({ damages: [] as Damage[] })),
    apiFetch<Paginated<Comment>>(`/api/products/${id}/comments`).catch(
      () => ({ items: [] as Comment[], total: 0, limit: 20, offset: 0 }),
    ),
  ])

  return {
    product,
    damages: damagesRes.damages,
    comments: commentsRes.items,
  }
}
