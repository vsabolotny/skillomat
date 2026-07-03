import type { IconName } from './LandingIcons'

/**
 * Static placeholder content for the user profile page (MOB-14). Not wired to the
 * backend yet — the profile, skills, offers, and stats are illustrative sample
 * data mirroring the "NomadSkills – User Profile" design.
 */

export interface ProfileSummary {
  name: string
  tagline: string
  /** Descriptive label for the cover-photo placeholder (no external image host). */
  coverLabel: string
  trades: number
  rating: number
}

export const profile: ProfileSummary = {
  name: 'Elena Rodriguez',
  tagline: 'Digital nomad & baker',
  coverLabel:
    'Portrait of Elena Rodriguez smiling in a sunlit rustic outdoor café surrounded by tropical plants.',
  trades: 42,
  rating: 4.9,
}

export interface Skill {
  label: string
  icon: IconName
}

export const skills: Skill[] = [
  { label: 'Artisan Sourdough', icon: 'bakery' },
  { label: 'UI Design', icon: 'laptop' },
  { label: 'Spanish (Native)', icon: 'translate' },
  { label: 'Photography', icon: 'camera' },
]

export interface Offer {
  title: string
  location: string
  /** Descriptive label for the thumbnail placeholder. */
  mediaLabel: string
  status: 'Trading'
  active: boolean
}

export const offers: Offer[] = [
  {
    title: 'Sourdough Masterclass for Skills',
    location: 'Lisbon, Portugal',
    mediaLabel: 'Flour-dusted hands kneading dough on a rustic wooden table.',
    status: 'Trading',
    active: true,
  },
  {
    title: 'Quick UI Audit for Local Cafes',
    location: 'Remote / Local',
    mediaLabel: 'A laptop showing colourful UI wireframes beside a coffee cup.',
    status: 'Trading',
    active: true,
  },
]

export interface Stat {
  value: number
  label: string
  icon: IconName
  tone: 'secondary' | 'primary'
}

export const stats: Stat[] = [
  { value: 12, label: 'Active Trades', icon: 'history', tone: 'secondary' },
  { value: 158, label: 'Saved by others', icon: 'heart', tone: 'primary' },
]
