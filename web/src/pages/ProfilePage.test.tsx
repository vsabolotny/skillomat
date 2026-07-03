import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { ProfilePage } from './ProfilePage'

function renderProfile() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  )
}

test('renders the profile identity and headline stats', () => {
  renderProfile()
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Elena Rodriguez')
  expect(screen.getByText('Digital nomad & baker')).toBeInTheDocument()
  expect(screen.getByText('42')).toBeInTheDocument()
  expect(screen.getByText('4.9')).toBeInTheDocument()
})

test('lists every verified skill', () => {
  renderProfile()
  for (const skill of ['Artisan Sourdough', 'UI Design', 'Spanish (Native)', 'Photography']) {
    expect(screen.getByText(skill)).toBeInTheDocument()
  }
})

test('renders the active offers with their locations', () => {
  renderProfile()
  expect(screen.getByRole('heading', { name: 'Sourdough Masterclass for Skills' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Quick UI Audit for Local Cafes' })).toBeInTheDocument()
  expect(screen.getByText('Lisbon, Portugal')).toBeInTheDocument()
})

test('renders the summary stat figures', () => {
  renderProfile()
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('Active Trades')).toBeInTheDocument()
  expect(screen.getByText('158')).toBeInTheDocument()
  expect(screen.getByText('Saved by others')).toBeInTheDocument()
})

test('marks the Profile bottom-nav item as the current page', () => {
  renderProfile()
  const current = screen.getByRole('link', { current: 'page' })
  expect(current).toHaveTextContent('Profile')
  expect(current).toHaveAttribute('href', '/profile')
})
