import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isApiError } from '../api'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>Sign in</h1>

      <a className="auth-google" href="/api/auth/google/redirect">
        Sign in with Google
      </a>

      <div className="auth-divider">or</div>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}

        <label>
          Email
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-links">
        <Link to="/forgot-password">Forgot your password?</Link>
        <Link to="/register">Create an account</Link>
      </p>
    </section>
  )
}
