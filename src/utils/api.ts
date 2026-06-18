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

async function withTokenRefresh(
  makeRequest: (token: string | null) => Promise<Response>,
): Promise<Response> {
  let res = await makeRequest(localStorage.getItem('token'))
  if (res.status === 401 && auth.currentUser) {
    const newToken = await auth.currentUser.getIdToken(true)
    localStorage.setItem('token', newToken)
    res = await makeRequest(newToken)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Response(JSON.stringify(body), { status: res.status })
  }
  return res
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const res = await withTokenRefresh(token => {
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers, body: formData })
  })
  return res.json()
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await withTokenRefresh(token =>
    fetch(`${API_BASE_URL}${path}`, buildRequest(token, options)),
  )
  if (res.status === 204) return undefined as T
  return res.json()
}
