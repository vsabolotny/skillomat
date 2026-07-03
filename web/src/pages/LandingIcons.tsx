import type { SVGProps } from 'react'

/**
 * Small inline-SVG icon set for the landing page. Strokes use `currentColor` and
 * a 2px weight to match the design system's rounded, tactile icon language, so no
 * icon-font runtime dependency is needed.
 */

export type IconName =
  | 'pin'
  | 'search'
  | 'map'
  | 'laptop'
  | 'leaf'
  | 'brush'
  | 'architecture'
  | 'handshake'
  | 'verified'
  | 'star'
  | 'chevron'
  | 'arrow'
  | 'globe'
  | 'camera'
  | 'mail'
  | 'handyman'
  | 'chat'
  | 'person'
  | 'settings'
  | 'bell'
  | 'translate'
  | 'history'
  | 'heart'
  | 'bakery'

const PATHS: Record<IconName, string> = {
  pin: 'M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z M12 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M20 20l-4-4',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z M9 4v14 M15 6v14',
  laptop: 'M4 6h16v9H4Z M2 19h20 M9 19l1-2h4l1 2',
  leaf: 'M4 20c0-8 6-14 16-14 0 10-6 15-14 15 M4 20c2-5 5-8 9-10',
  brush: 'M14 4l6 6-8 8H6v-6l8-8Z M12 6l6 6 M6 16l-2 4 4-2',
  architecture: 'M12 3 4 20h16L12 3Z M12 9v11 M8 15h8',
  handshake: 'M8 12l3 3 2-2 3 3 3-3-5-5-3 2-3-2-4 4 4 4Z',
  verified:
    'M12 3l2.4 1.7 2.9-.2 1 2.7 2.4 1.6-.9 2.8.9 2.8-2.4 1.6-1 2.7-2.9-.2L12 21l-2.4-1.7-2.9.2-1-2.7L3.3 15l.9-2.8-.9-2.8L5.7 7.8l1-2.7 2.9.2L12 3Z M9 12l2 2 4-4',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z',
  chevron: 'M9 6l6 6-6 6',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3 12h18 M12 3c3 3.5 3 14.5 0 18 M12 3c-3 3.5-3 14.5 0 18',
  camera: 'M4 8h3l2-2h6l2 2h3v11H4Z M12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  mail: 'M3 6h18v12H3Z M3 7l9 6 9-6',
  handyman: 'M14 6l4-2 2 2-2 4-3 3 4 4-2 2-4-4-4 4-2-2 8-8-1-1-2 2-2-2 4-4 2 2Z',
  chat: 'M4 5h16v11H9l-4 3v-3H4Z',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M5 20a7 7 0 0 1 14 0',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
  translate: 'M4 5h8 M8 3v2c0 4-2 7-6 8 M6 9c1 3 4 5 6 5 M13 20l4-9 4 9 M14.5 17h5',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 4v4h4 M12 8v4l3 2',
  heart: 'M12 20s-7-4.7-9.4-9A5 5 0 0 1 12 6a5 5 0 0 1 9.4 5c-2.4 4.3-9.4 9-9.4 9Z',
  bakery: 'M4 11a4 4 0 0 1 4-4h8a4 4 0 0 1 0 8H8a4 4 0 0 1-4-4Z M9 7v8 M13 7v8',
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
}

export function Icon({ name, ...props }: IconProps) {
  const filled = name === 'star'
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
