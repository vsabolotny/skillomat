import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isApiError } from '../api'
import { useAuth } from '../auth/useAuth'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      navigate('/')
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
      <h1>Create your account</h1>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}

        <label>
          Name
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          {fieldErrors.name && <span className="auth-field-error">{fieldErrors.name[0]}</span>}
        </label>

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
          Password
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
          Confirm password
          <input
            type="password"
            name="password_confirmation"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="auth-links">
        <Link to="/login">Already have an account? Sign in</Link>
      </p>
    </section>
  )
}
