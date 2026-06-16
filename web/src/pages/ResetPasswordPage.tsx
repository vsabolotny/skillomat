import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch, isApiError } from '../api'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const emailFromLink = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(emailFromLink)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: {
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        },
      })
      navigate('/login')
    } catch (cause) {
      if (isApiError(cause)) {
        setError(cause.message)
        setFieldErrors(cause.errors ?? {})
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>Choose a new password</h1>

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
          {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email[0]}</span>}
        </label>

        <label>
          New password
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {fieldErrors.password && (
            <span className="auth-field-error">{fieldErrors.password[0]}</span>
          )}
        </label>

        <label>
          Confirm new password
          <input
            type="password"
            name="password_confirmation"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>

      <p className="auth-links">
        <Link to="/login">Back to sign in</Link>
      </p>
    </section>
  )
}
