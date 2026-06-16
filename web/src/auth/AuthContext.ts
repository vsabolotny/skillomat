import { createContext } from 'react'

export interface User {
  id: number
  name: string
  email: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthContextValue {
  user: User | null
  token: string | null
  /** True while the stored token is being validated on first load. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  /** Adopt a token obtained out-of-band (e.g. the Google OAuth redirect). */
  applyToken: (token: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const TOKEN_STORAGE_KEY = 'skillomat_token'
