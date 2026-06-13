import { HealthStatus } from './components/HealthStatus'
import './App.css'

function App() {
  return (
    <main className="app">
      <h1>Skillomat</h1>
      <p className="tagline">
        A marketplace where travelers trade their skills for money, goods, stays,
        or experiences.
      </p>
      <HealthStatus />
    </main>
  )
}

export default App
