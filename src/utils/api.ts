const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Response(JSON.stringify(body), { status: res.status })
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// 共通型
export type Product = {
  id: string
  title: string
  price: number
  condition: 'good' | 'fair' | 'poor'
  status: 'on_sale' | 'sold_out'
  thumbnail_url: string
  model: { status: 'done' | 'processing'; glb_url: string | null } | null
  created_at: string
}

export type User = {
  id: string
  display_name: string
  avatar_url: string
  rating_avg: number
  rating_count: number
  created_at: string
  updated_at: string
}
