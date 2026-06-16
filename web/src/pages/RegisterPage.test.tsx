import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { jsonResponse } from '../test/helpers'
import { RegisterPage } from './RegisterPage'

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<div>home</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.removeItem('skillomat_token'))
afterEach(() => vi.restoreAllMocks())

test('surfaces server-side validation errors per field', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    jsonResponse(
      {
        message: 'The given data was invalid.',
        errors: { email: ['The email has already been taken.'] },
      },
      { ok: false, status: 422 },
    ),
  )
  vi.stubGlobal('fetch', fetchMock)

  renderRegister()
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Jane' } })
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'taken@example.com' } })
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret-password' } })
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: 'secret-password' },
  })
  fireEvent.click(screen.getByRole('button', { name: /create account/i }))

  await waitFor(() => expect(screen.getByText(/already been taken/i)).toBeInTheDocument())
  expect(localStorage.getItem('skillomat_token')).toBeNull()
})
