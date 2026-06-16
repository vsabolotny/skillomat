import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function GoogleCallbackPage() {
  const { applyToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    const token = new URLSearchParams(hash).get('token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    let active = true
    applyToken(token)
      .then(() => {
        if (active) navigate('/', { replace: true })
      })
      .catch(() => {
        if (active) setError('Google sign-in failed. Please try again.')
      })

    return () => {
      active = false
    }
  }, [applyToken, navigate])

  return (
    <section className="auth-card">
      {error ? (
        <>
          <p role="alert" className="auth-error">
            {error}
          </p>
          <p className="auth-links">
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      ) : (
        <p role="status">Signing you in…</p>
      )}
    </section>
  )
}
