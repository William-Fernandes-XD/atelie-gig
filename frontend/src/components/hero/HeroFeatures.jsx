import { motion } from 'framer-motion'
import { HeroFeatureIcon } from './HeroIcons'

export function HeroFeatures({ features = [], compact = false, overlay = false }) {
  const list = [...features].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
  if (!list.length) return null

  return (
    <motion.ul
      className={`mt-6 grid w-full max-w-md gap-2 sm:gap-4 ${
        list.length === 1 ? 'grid-cols-1' : list.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
      }`}
      initial={compact ? false : 'hidden'}
      animate={compact ? undefined : 'show'}
      variants={
        compact
          ? undefined
          : {
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
            }
      }
    >
      {list.map((feature) => (
        <motion.li
          key={feature.id ?? `${feature.icon}-${feature.title}`}
          variants={
            compact
              ? undefined
              : {
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0 },
                }
          }
          className={`flex flex-col items-center gap-1.5 ${
            overlay ? 'text-brand-pink' : 'text-brand-rose dark:text-brand-pink'
          }`}
        >
          <HeroFeatureIcon icon={feature.icon} />
          <span
            className={`text-[8px] font-semibold uppercase leading-tight tracking-wide sm:text-[9px] ${
              overlay ? 'text-white/85' : 'text-neon-muted'
            }`}
          >
            {feature.title}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  )
}
