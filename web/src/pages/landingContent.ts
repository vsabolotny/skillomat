import type { IconName } from './LandingIcons'

/**
 * Static placeholder content for the marketing landing page. Not wired to the
 * backend yet — categories, steps, and nomads are illustrative sample data.
 */

export interface Category {
  title: string
  blurb?: string
  icon: IconName
  /** Visual weight in the bento grid. */
  size: 'lead' | 'wide' | 'tile'
  tone: 'secondary' | 'tertiary' | 'neutral' | 'primary'
}

export const categories: Category[] = [
  {
    title: 'Tech & Development',
    blurb: 'JavaScript, Python, UI Design, and Web Dev.',
    icon: 'laptop',
    size: 'lead',
    tone: 'secondary',
  },
  { title: 'Permaculture', icon: 'leaf', size: 'tile', tone: 'tertiary' },
  { title: 'Creative Arts', icon: 'brush', size: 'tile', tone: 'neutral' },
  {
    title: 'Construction',
    blurb: 'Carpentry, Renovation, Bio-building.',
    icon: 'architecture',
    size: 'wide',
    tone: 'primary',
  },
]

export interface Step {
  title: string
  body: string
  icon: IconName
  tone: 'secondary' | 'tertiary' | 'primary'
}

export const steps: Step[] = [
  {
    title: 'Discover',
    body: 'Browse vetted skills from nomads currently in your destination or find hosts needing your expertise.',
    icon: 'search',
    tone: 'secondary',
  },
  {
    title: 'Connect',
    body: 'Communicate directly through our secure platform to discuss goals, logistics, and exchange terms.',
    icon: 'handshake',
    tone: 'tertiary',
  },
  {
    title: 'Exchange',
    body: 'Meet, share your skills, and build lasting connections. Trust is earned through our community rating system.',
    icon: 'verified',
    tone: 'primary',
  },
]

export interface Nomad {
  name: string
  location: string
  rating: string
  verified: boolean
  skills: string[]
  lookingFor: string
}

export const nomads: Nomad[] = [
  {
    name: 'Alex Rivera',
    location: 'Mexico City, MX',
    rating: '4.9',
    verified: true,
    skills: ['Web Development', 'SEO'],
    lookingFor: 'Photography',
  },
  {
    name: 'Maya Chen',
    location: 'Chiang Mai, TH',
    rating: '5.0',
    verified: false,
    skills: ['UX Design', 'Branding'],
    lookingFor: 'Yoga Instructing',
  },
  {
    name: 'Marcus Thorne',
    location: 'Berlin, DE',
    rating: '4.8',
    verified: false,
    skills: ['Sustainable Woodworking', 'Permaculture'],
    lookingFor: 'Social Media',
  },
]

export interface FooterColumn {
  heading: string
  links: string[]
}

export const footerColumns: FooterColumn[] = [
  { heading: 'Community', links: ['Explore Skills', 'Nomad Stories', 'Events', 'Forum'] },
  { heading: 'About', links: ['Our Mission', 'Trust & Safety', 'Careers', 'Contact'] },
  { heading: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
]
