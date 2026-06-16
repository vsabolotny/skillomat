import { Link } from 'react-router-dom'
import { HealthStatus } from './components/HealthStatus'
import { useAuth } from './auth/useAuth'
import './App.css'

function App() {
  const { user, logout } = useAuth()

  return (
    <main className="app">
      <h1>Skillomat</h1>
      <p className="tagline">
        A marketplace where travelers trade their skills for money, goods, stays,
        or experiences.
      </p>

      <div className="account">
        {user ? (
          <>
            <span>
              Signed in as <strong>{user.name}</strong>
            </span>
            <button type="button" onClick={() => logout()}>
              Sign out
            </button>
          </>
        ) : (
          <nav className="account-links">
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
          </nav>
        )}
      </div>

      <HealthStatus />
    </main>
  )
}

export default App
