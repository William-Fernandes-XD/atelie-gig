const LOGO_SRC = '/images/logo-gig.png'

const sizes = {
  xs: 'h-9 w-auto',
  sm: 'h-11 w-auto',
  md: 'h-20 w-auto',
  lg: 'h-28 w-auto',
  header: 'h-11 w-auto sm:h-12 md:h-14',
}

export function Logo({ size = 'md', className = '' }) {
  const sizeClass = sizes[size] || sizes.md
  const isHeader = size === 'header'

  return (
    <img
      src={`${LOGO_SRC}?v=5`}
      alt="GIG — Moda Feminina"
      className={`${sizeClass} ${
        isHeader ? 'max-w-[120px] sm:max-w-[140px] md:max-w-[160px]' : 'max-w-[200px]'
      } shrink-0 object-contain object-left ${className}`}
    />
  )
}
