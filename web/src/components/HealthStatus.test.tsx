import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { HealthStatus } from './HealthStatus'

afterEach(() => {
  vi.restoreAllMocks()
})

test('shows connected when the backend reports a healthy database', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', database: 'connected' }),
    }),
  )

  render(<HealthStatus />)

  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'connected'),
  )
  expect(screen.getByText(/backend connected/i)).toBeInTheDocument()
})

test('shows unreachable when the request fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

  render(<HealthStatus />)

  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveAttribute('data-state', 'unreachable'),
  )
  expect(screen.getByText(/backend unreachable/i)).toBeInTheDocument()
})
