import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, test, vi } from 'vitest'
import { jsonResponse } from '../test/helpers'
import { ForgotPasswordPage } from './ForgotPasswordPage'

afterEach(() => vi.restoreAllMocks())

test('shows a confirmation message after requesting a reset link', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    jsonResponse({ message: 'If that email is registered, a reset link is on its way.' }),
  )
  vi.stubGlobal('fetch', fetchMock)

  render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  )

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/reset link is on its way/i))
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/auth/forgot-password',
    expect.objectContaining({ method: 'POST' }),
  )
})
