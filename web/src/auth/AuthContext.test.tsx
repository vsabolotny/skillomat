import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { jsonResponse } from '../test/helpers'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

function Probe() {
  const { user, loading, logout } = useAuth()
  const label = loading ? 'loading' : (user?.name ?? 'anon')
  return (
    <div>
      <span>state:{label}</span>
      <button type="button" onClick={() => logout()}>
        out
      </button>
    </div>
  )
}

beforeEach(() => localStorage.removeItem('skillomat_token'))
afterEach(() => vi.restoreAllMocks())

test('hydrates the user from a stored token', async () => {
  localStorage.setItem('skillomat_token', 'tok-xyz')
  const fetchMock = vi
    .fn()
    .mockResolvedValue(jsonResponse({ id: 1, name: 'Jane', email: 'jane@example.com' }))
  vi.stubGlobal('fetch', fetchMock)

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )

  await waitFor(() => expect(screen.getByText('state:Jane')).toBeInTheDocument())
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/auth/me',
    expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok-xyz' }) }),
  )
})

test('logout clears the stored session', async () => {
  localStorage.setItem('skillomat_token', 'tok-xyz')
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({ id: 1, name: 'Jane', email: 'jane@example.com' }))
    .mockResolvedValueOnce(jsonResponse(undefined, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )

  await waitFor(() => expect(screen.getByText('state:Jane')).toBeInTheDocument())

  fireEvent.click(screen.getByRole('button', { name: 'out' }))

  await waitFor(() => expect(screen.getByText('state:anon')).toBeInTheDocument())
  expect(localStorage.getItem('skillomat_token')).toBeNull()
})
