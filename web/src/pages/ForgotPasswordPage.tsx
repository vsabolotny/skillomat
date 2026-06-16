import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, isApiError } from '../api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setStatus(null)
    setSubmitting(true)
    try {
      const { message } = await apiFetch<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })
      setStatus(message)
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>Reset your password</h1>

      {status ? (
        <p role="status" className="auth-status">
          {status}
        </p>
      ) : (
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

          <button type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
  )
}
