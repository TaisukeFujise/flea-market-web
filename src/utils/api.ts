import { auth } from '../firebase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function buildRequest(token: string | null, options?: RequestInit): RequestInit {
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  let res = await fetch(`${API_BASE_URL}${path}`, buildRequest(token, options))

  if (res.status === 401 && auth.currentUser) {
    const newToken = await auth.currentUser.getIdToken(true)
    localStorage.setItem('token', newToken)
    res = await fetch(`${API_BASE_URL}${path}`, buildRequest(newToken, options))
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Response(JSON.stringify(body), { status: res.status })
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
