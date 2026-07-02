import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthProvider'
import { jsonResponse } from '../test/helpers'
import { LandingPage } from './LandingPage'

function renderLanding() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.removeItem('skillomat_token'))
afterEach(() => vi.restoreAllMocks())

test('renders the hero headline and supporting copy', () => {
  renderLanding()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
    'Exchange Skills, Explore the World.',
  )
  expect(screen.getByText(/premium marketplace connecting global nomadic talent/i)).toBeInTheDocument()
})

test('renders every marketing section heading', () => {
  renderLanding()
  for (const heading of [
    'Top Skill Categories',
    'Experience the Journey',
    'Trending Nomads',
    'Ready to start your next adventure?',
  ]) {
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  }
})

test('lists the trending nomads', () => {
  renderLanding()
  expect(screen.getByRole('heading', { name: 'Alex Rivera' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Maya Chen' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Marcus Thorne' })).toBeInTheDocument()
})

test('points the primary CTAs at the auth routes when signed out', () => {
  renderLanding()
  expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/register')
  expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  expect(screen.getByRole('link', { name: /become a nomad/i })).toHaveAttribute('href', '/register')
})

test('greets the signed-in user and offers a sign-out control', async () => {
  localStorage.setItem('skillomat_token', 'tok-123')
  const fetchMock = vi.fn().mockResolvedValue(
    jsonResponse({ id: 1, name: 'Jane', email: 'jane@example.com' }),
  )
  vi.stubGlobal('fetch', fetchMock)

  renderLanding()

  await waitFor(() => expect(screen.getByText(/signed in as/i)).toHaveTextContent('Jane'))
  expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/auth/me',
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer tok-123' }),
    }),
  )
})
