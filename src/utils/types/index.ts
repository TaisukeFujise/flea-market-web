// ---- Shared sub-types ----

export type UserSummary = {
  id: string
  display_name: string
  avatar_url: string
}

export type SellerSummary = {
  id: string
  display_name: string
  avatar_url: string
  rating_avg: number | null
  rating_count: number
}

export type ProductSummary = {
  id: string
  title: string
  price: number
  thumbnail_url: string
  status: 'on_sale' | 'sold_out'
}

export type ModelInfo = {
  status: 'done' | 'processing'
  glb_url: string | null
} | null

// ---- Pagination ----

export type Paginated<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

// ---- Users  (GET /api/me, PATCH /api/me, DELETE /api/me) ----

export type User = {
  id: string
  display_name: string
  avatar_url: string
  rating_avg: number
  rating_count: number
  created_at: string
  updated_at: string
}

// ---- Categories  (GET /api/categories) ----

export type Category = {
  id: string
  parent_id: string | null
  name: string
  children: Category[]
}

// ---- Products  (GET /api/products, GET /api/products/:id, POST /api/products, PATCH /api/products/:id, DELETE /api/products/:id) ----

export type Product = {
  id: string
  category_id: string
  title: string
  price: number
  condition: 'good' | 'fair' | 'poor'
  status: 'on_sale' | 'sold_out'
  thumbnail_url: string
  damage_count?: number
  model: ModelInfo
  created_at: string
}

export type ProductDetail = {
  id: string
  seller: SellerSummary
  category_id: string
  title: string
  description: string
  price: number
  condition: 'good' | 'fair' | 'poor'
  condition_note: string
  status: 'on_sale' | 'sold_out'
  damage_count: number
  images: ProductImage[]
  model: ModelInfo
  liked: boolean | null
  created_at: string
  updated_at: string
}

export type ProductImage = {
  id: string
  url: string
  angle: 'front' | 'back' | 'right' | 'left' | 'top'
}

export type ProductCreateResponse = {
  id: string
}

// ---- Images  (POST /api/images) ----

export type ImageUploadResponse = {
  image_ids: string[]
  damage_detection: 'processing'
}

// ---- Damages  (GET /api/products/:id/damages) ----

export type Damage = {
  id: string
  image_id: string
  damage_type: string
  bbox_x1: number
  bbox_y1: number
  bbox_x2: number
  bbox_y2: number
  description: string
  model_x: number | null
  model_y: number | null
  model_z: number | null
}

// TODO: バックエンド未実装（3Dフェーズ）
// PATCH /api/damages/:id - 3D座標更新

// ---- Comments  (GET /api/products/:id/comments, POST /api/products/:id/comments, DELETE /api/comments/:id) ----

export type Comment = {
  id: string
  user: UserSummary
  content: string
  created_at: string
}

// ---- Likes  (POST /api/products/:id/likes, DELETE /api/products/:id/likes, GET /api/me/likes) ----

export type LikeItem = {
  product: ProductSummary
  created_at: string
}

// ---- Orders  (POST /api/products/:id/orders, GET /api/orders, GET /api/orders/:id, PATCH /api/orders/:id) ----

export type OrderStatus = 'pending' | 'completed' | 'cancelled'
export type OrderRole = 'buyer' | 'seller'

export type OrderCreateResponse = {
  id: string
  message_room_id: string
}

export type Order = {
  id: string
  product: Pick<ProductSummary, 'id' | 'title' | 'thumbnail_url'>
  counterpart: UserSummary
  price: number
  status: OrderStatus
  role: OrderRole
  created_at: string
}

export type OrderDetail = {
  id: string
  product: Pick<ProductSummary, 'id' | 'title' | 'thumbnail_url'>
  counterpart: UserSummary
  price: number
  status: OrderStatus
  role: OrderRole
  message_room_id: string
  created_at: string
  updated_at: string
}

// ---- Messages  (GET /api/message-rooms/:id/messages, POST /api/message-rooms/:id/messages) ----

export type Message = {
  id: string
  sender: UserSummary
  content: string
  created_at: string
}

// ---- Viewing History  (GET /api/me/viewing-history) ----

export type ViewingHistoryItem = {
  product: ProductSummary
  viewed_at: string
}

// ---- WebSocket events  (WS /ws) ----

export type WsNewMessageEvent = {
  type: 'new_message'
  payload: {
    room_id: string
  }
}

export type WsDamageDetectionCompleteEvent = {
  type: 'damage_detection_complete'
  payload: {
    condition: 'good' | 'fair' | 'poor'
    condition_note: string
    damages: Array<{
      image_id: string
      image_url: string
      image_angle: 'front' | 'back' | 'right' | 'left' | 'top'
      damage_type: string
      bbox_x1: number | null
      bbox_y1: number | null
      bbox_x2: number | null
      bbox_y2: number | null
      description: string | null
    }>
  }
}

export type WsDamageDetectionFailedEvent = {
  type: 'damage_detection_failed'
}

// TODO: バックエンド未実装（3Dフェーズ）
export type WsModelGenerationCompleteEvent = {
  type: 'model_generation_complete'
  payload: {
    product_id: string
    glb_url: string
  }
}

export type WsEvent =
  | WsNewMessageEvent
  | WsDamageDetectionCompleteEvent
  | WsDamageDetectionFailedEvent
  | WsModelGenerationCompleteEvent
