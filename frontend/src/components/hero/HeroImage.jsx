import { motion } from 'framer-motion'
import { resolveHeroMediaUrl } from './heroDefaults'

export function HeroImage({ config, animate = true, variant = 'side' }) {
  const src = resolveHeroMediaUrl(config.heroImageUrl) || '/images/hero-boutique.png'
  const full = variant === 'full'
  const Wrapper = animate ? motion.div : 'div'
  const motionProps = animate
    ? {
        initial: { opacity: 0, scale: 1.04 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.95, ease: 'easeOut' },
      }
    : {}

  return (
    <Wrapper
      className={
        full
          ? 'absolute inset-0 z-0 overflow-hidden'
          : 'relative min-h-[220px] overflow-hidden sm:min-h-[260px] lg:min-h-full'
      }
      {...motionProps}
    >
      <img
        src={src}
        alt="Modelo GIG em boutique de moda feminina"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {full ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/45" />
          <div className="pointer-events-none absolute inset-0 bg-[#F7E6EA]/25 dark:bg-neon-bg/35" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#F7E6EA]/80 to-transparent dark:from-neon-bg/80 lg:w-16" />
          <div className="pointer-events-none absolute -bottom-6 left-1/2 h-16 w-2/3 -translate-x-1/2 rounded-full bg-brand-pink/50 blur-3xl dark:bg-white/[0.06]" />
        </>
      )}
    </Wrapper>
  )
}
