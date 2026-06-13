import { createContext, useContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'

export type AuthState = {
  user: FirebaseUser | null
  token: string | null
  loading: boolean
}

export const AuthContext = createContext<AuthState>({ user: null, token: null, loading: true })

export function useAuth() {
  return useContext(AuthContext)
}
