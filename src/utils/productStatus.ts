import type { Product } from './types'

export const PRODUCT_STATUS_LABEL: Record<Product['status'], string> = {
  on_sale: '出品中',
  sold_out: '売却済み',
}
