export function HeartIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21s-6.7-4.35-9.33-7.4C.8 11.4.5 8.7 2.1 6.9 3.5 5.3 5.9 5.1 7.6 6.4L12 10l4.4-3.6c1.7-1.3 4.1-1.1 5.5.5 1.6 1.8 1.3 4.5-.57 6.7C18.7 16.65 12 21 12 21z" />
    </svg>
  )
}

export function DressIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4l-1 3 2 1v2L6 14l1 6h10l1-6-4-4V8l2-1-1-3-3 1-3-1z" />
    </svg>
  )
}

export function SparkleIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l1.2 4.8L18 8l-4.8 1.2L12 14l-1.2-4.8L6 8l4.8-1.2L12 2z" />
      <path d="M19 13l.7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13z" opacity=".85" />
      <path d="M5 14l.6 2L8 17l-2.4.6L5 20l-.6-2.4L2 17l2.4-.6L5 14z" opacity=".7" />
    </svg>
  )
}

export function StarIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5l2.4 5.7 6.1.6-4.6 4 1.4 5.9L12 15.8 6.7 18.7l1.4-5.9-4.6-4 6.1-.6L12 2.5z" />
    </svg>
  )
}

export function GiftIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 114 0v2M12 8H7a2 2 0 00-2 2v9a2 2 0 002 2h10a2 2 0 002-2v-9a2 2 0 00-2-2h-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16" />
    </svg>
  )
}

const ICON_MAP = {
  dress: DressIcon,
  heart: HeartIcon,
  sparkle: SparkleIcon,
  star: StarIcon,
  gift: GiftIcon,
}

export const HERO_ICON_OPTIONS = [
  { value: 'dress', label: 'Vestido' },
  { value: 'heart', label: 'Coração' },
  { value: 'sparkle', label: 'Brilho' },
  { value: 'star', label: 'Estrela' },
  { value: 'gift', label: 'Presente' },
]

export function HeroFeatureIcon({ icon, className = 'h-5 w-5' }) {
  const Icon = ICON_MAP[icon] || HeartIcon
  return <Icon className={className} />
}
