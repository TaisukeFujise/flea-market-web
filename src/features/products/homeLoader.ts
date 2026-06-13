import type { Paginated, Product } from '../../utils/types'
import { apiFetch } from '../../utils/api'

export async function homeLoader(): Promise<Paginated<Product>> {
  return apiFetch<Paginated<Product>>('/api/products')
}
