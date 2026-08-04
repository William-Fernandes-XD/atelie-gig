const sizes = {
  xs: {
    brand: 'text-base leading-tight tracking-[0.12em]',
    tag: 'text-[8px] leading-none tracking-[0.12em]',
    sep: 'text-xs',
  },
  sm: {
    brand: 'text-xl leading-tight tracking-[0.14em]',
    tag: 'text-[9px] leading-none tracking-[0.14em]',
    sep: 'text-sm',
  },
  md: {
    brand: 'text-3xl leading-tight tracking-[0.16em]',
    tag: 'text-xs leading-none tracking-[0.16em]',
    sep: 'text-base',
  },
  lg: {
    brand: 'text-4xl leading-tight tracking-[0.16em]',
    tag: 'text-sm leading-none tracking-[0.18em]',
    sep: 'text-lg',
  },
  header: {
    brand: 'text-xl leading-tight tracking-[0.14em] sm:text-2xl sm:tracking-[0.16em]',
    tag: 'text-[9px] leading-none tracking-[0.14em] sm:text-[10px]',
    sep: 'text-sm sm:text-base',
  },
}

export function Logo({ size = 'md', className = '' }) {
  const s = sizes[size] || sizes.md

  return (
    <span
      className={`inline-flex items-baseline gap-2.5 py-0.5 ${className}`}
      aria-label="GIG — Moda Feminina"
    >
      <span
        className={`font-display font-bold text-brand-charcoal dark:text-neon-text neon-glow-text ${s.brand}`}
      >
        GIG
      </span>
      <span
        className={`relative -top-px select-none font-light text-brand-charcoal/35 dark:text-neon-line/35 ${s.sep}`}
        aria-hidden
      >
        |
      </span>
      <span
        className={`relative -top-px font-sans font-medium uppercase text-brand-charcoal/65 dark:text-neon-muted ${s.tag}`}
      >
        Moda Feminina
      </span>
    </span>
  )
}
