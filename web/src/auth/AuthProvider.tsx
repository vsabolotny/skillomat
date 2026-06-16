import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiFetch } from '../api'
import {
  AuthContext,
  TOKEN_STORAGE_KEY,
  type RegisterInput,
  type User,
} from './AuthContext'

interface AuthResponse {
  user: User
  token: string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  )
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(token))

  const persistToken = useCallback((value: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, value)
    setToken(value)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // On first load (or a fresh token with no user yet) validate the token by
  // resolving the current user; drop it if the server rejects it.
  useEffect(() => {
    // Only the initial mount with a stored-but-unvalidated token needs to
    // resolve a user; `loading` is seeded from that token, so nothing to do
    // when there's no token or the user is already known.
    if (!token || user) {
      return
    }

    let active = true
    apiFetch<User>('/auth/me', { token })
      .then((resolved) => {
        if (active) setUser(resolved)
      })
      .catch(() => {
        if (active) clearSession()
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token, user, clearSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      setUser(result.user)
      persistToken(result.token)
    },
    [persistToken],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: input,
      })
      setUser(result.user)
      persistToken(result.token)
    },
    [persistToken],
  )

  const applyToken = useCallback(
    async (value: string) => {
      persistToken(value)
      const resolved = await apiFetch<User>('/auth/me', { token: value })
      setUser(resolved)
    },
    [persistToken],
  )

  const logout = useCallback(async () => {
    try {
      if (token) await apiFetch('/auth/logout', { method: 'POST', token })
    } finally {
      clearSession()
    }
  }, [token, clearSession])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, applyToken }),
    [user, token, loading, login, register, logout, applyToken],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
