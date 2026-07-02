import { useEffect, useState } from 'react'
import './HealthStatus.css'

type HealthState = 'loading' | 'connected' | 'unreachable'

interface HealthResponse {
  status: string
  database: string
}

const LABELS: Record<HealthState, string> = {
  loading: 'Checking backend…',
  connected: '● Backend connected',
  unreachable: '● Backend unreachable',
}

export function HealthStatus() {
  const [state, setState] = useState<HealthState>('loading')

  useEffect(() => {
    let active = true

    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json() as Promise<HealthResponse>
      })
      .then((body) => {
        if (!active) return
        setState(body.database === 'connected' ? 'connected' : 'unreachable')
      })
      .catch(() => {
        if (active) setState('unreachable')
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <div role="status" data-state={state} className={`health health--${state}`}>
      {LABELS[state]}
    </div>
  )
}
