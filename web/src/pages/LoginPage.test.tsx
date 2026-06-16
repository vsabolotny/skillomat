import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { useAuth } from '../auth/useAuth'
import { jsonResponse } from '../test/helpers'
import { LoginPage } from './LoginPage'

function HomeProbe() {
  const { user } = useAuth()
  return <div>home:{user?.name ?? 'anon'}</div>
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeProbe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.removeItem('skillomat_token'))
afterEach(() => vi.restoreAllMocks())

test('signs in, stores the token, and lands on home', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    jsonResponse({ user: { id: 1, name: 'Jane', email: 'jane@example.com' }, token: 'tok-123' }),
  )
  vi.stubGlobal('fetch', fetchMock)

  renderLogin()
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret-password' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => expect(screen.getByText('home:Jane')).toBeInTheDocument())
  expect(localStorage.getItem('skillomat_token')).toBe('tok-123')
  expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
})

test('shows an inline error on rejected credentials', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    jsonResponse({ message: 'These credentials do not match our records.' }, { ok: false, status: 422 }),
  )
  vi.stubGlobal('fetch', fetchMock)

  renderLogin()
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent(/credentials do not match/i),
  )
  expect(localStorage.getItem('skillomat_token')).toBeNull()
})
