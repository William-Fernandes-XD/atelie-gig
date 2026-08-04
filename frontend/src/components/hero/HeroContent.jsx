import { motion } from 'framer-motion'
import { HeartIcon } from './HeroIcons'
import { HeroButtons } from './HeroButtons'
import { HeroFeatures } from './HeroFeatures'
import { resolveHeroMediaUrl } from './heroDefaults'

function titleSizeClass(size) {
  if (size === 'sm') return 'text-xl sm:text-2xl'
  if (size === 'lg') return 'text-3xl sm:text-4xl'
  return 'text-2xl sm:text-3xl'
}

function titleWeightClass(weight) {
  if (weight === 'normal') return 'font-normal'
  if (weight === 'semibold') return 'font-semibold'
  return 'font-bold'
}

export function HeroContent({ config, animate = true, overlay = false }) {
  const align = config.textAlignment === 'left' ? 'text-left items-start' : config.textAlignment === 'right' ? 'text-right items-end' : 'text-center items-center'
  const logoUrl = resolveHeroMediaUrl(config.logoImageUrl)
  const textMain = overlay ? 'text-white' : 'text-neon-text'
  const textMuted = overlay ? 'text-white/80' : 'text-neon-muted'
  const accent = overlay ? 'text-brand-pink' : 'text-brand-pink-dark dark:text-brand-pink'
  const rule = overlay ? 'bg-white/35' : 'bg-neon-text/20'

  const Brand = animate ? motion.div : 'div'
  const Body = animate ? motion.div : 'div'
  const brandMotion = animate
    ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.65, ease: 'easeOut' },
      }
    : {}
  const bodyMotion = animate
    ? {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, delay: 0.1, ease: 'easeOut' },
      }
    : {}

  return (
    <div
      className={`flex flex-col justify-center px-5 py-8 sm:px-8 lg:px-12 lg:py-10 ${align} ${
        overlay ? 'w-full max-w-2xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]' : ''
      }`}
    >
      <Brand {...brandMotion}>
        {logoUrl ? (
          <img src={logoUrl} alt="GIG" className="mx-auto h-12 w-auto object-contain sm:h-14" />
        ) : (
          <>
            <p className={`font-display text-3xl font-bold tracking-[0.3em] neon-glow-text sm:text-4xl ${textMain}`}>
              GIG
            </p>
            <p className={`mt-1 text-[10px] font-medium uppercase tracking-[0.3em] ${textMuted}`}>
              Moda Feminina
            </p>
            <div className={`mt-2 flex items-center justify-center ${accent}`}>
              <HeartIcon className="h-3 w-3" />
            </div>
          </>
        )}
      </Brand>

      <Body className="mt-5 max-w-md" {...bodyMotion}>
        <h1
          className={`font-display leading-snug ${textMain} ${titleSizeClass(config.titleFontSize)} ${titleWeightClass(config.titleFontWeight)}`}
        >
          {config.titleLine1}{' '}
          {config.titleLine2 && (
            <em
              className="italic font-semibold"
              style={{ color: config.titleLine2Color || undefined }}
            >
              {config.titleLine2}
            </em>
          )}
        </h1>

        <div className="mx-auto mt-3 flex max-w-[180px] items-center gap-2">
          <span className={`h-px flex-1 ${rule}`} />
          <HeartIcon className={`h-2.5 w-2.5 ${accent}`} />
          <span className={`h-px flex-1 ${rule}`} />
        </div>

        {config.description && (
          <p className={`mt-3 text-xs leading-relaxed sm:text-sm ${textMuted}`}>{config.description}</p>
        )}

        <HeroButtons config={config} animate={animate} />
      </Body>

      <HeroFeatures features={config.features} compact={!animate} overlay={overlay} />
    </div>
  )
}
