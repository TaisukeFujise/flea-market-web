import { redirect } from 'react-router-dom'
import { apiFetch } from './api'

export async function registerUser(displayName: string, avatarUrl: string | null) {
  await apiFetch('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({
      display_name: displayName,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    }),
  }).catch((res: Response) => {
    if (res.status !== 409) throw res
  })
}

export async function protectedLoader() {
  const token = localStorage.getItem('token')
  if (!token) return redirect('/login')
  return null
}

export async function guestOnlyLoader() {
  const token = localStorage.getItem('token')
  if (token) return redirect('/')
  return null
}
