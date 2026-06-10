import { createContext, useContext, useEffect, useState } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import { onAuthStateChanged } from 'firebase/auth'
import { redirect } from 'react-router-dom'
import { auth } from '../firebase'
import { apiFetch } from './api'

type AuthState = {
  user: FirebaseUser | null
  token: string | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ user: null, token: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, token: null, loading: true })

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken()
        localStorage.setItem('token', token)
        setState({ user, token, loading: false })
      } else {
        localStorage.removeItem('token')
        setState({ user: null, token: null, loading: false })
      }
    })
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

// ユーザー登録（Firebase Auth 後に呼ぶ）
export async function registerUser(displayName: string, avatarUrl: string) {
  await apiFetch('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
  }).catch((res: Response) => {
    if (res.status !== 409) throw res
  })
}

// 認証必須ルートの loader
export async function protectedLoader() {
  const token = localStorage.getItem('token')
  if (!token) return redirect('/login')
  return null
}

// ゲスト専用ルートの loader（login / signup）
export async function guestOnlyLoader() {
  const token = localStorage.getItem('token')
  if (token) return redirect('/')
  return null
}
