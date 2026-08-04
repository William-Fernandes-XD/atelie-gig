import { HeroContent } from './HeroContent'
import { HeroImage } from './HeroImage'

function heightClass(height) {
  if (height === 'small') return 'min-h-[min(36vh,320px)]'
  if (height === 'large') return 'min-h-[min(64vh,560px)]'
  return 'min-h-[min(48vh,420px)]'
}

function sectionBackground(config) {
  if (config.backgroundType === 'color' && config.backgroundColor) {
    return { className: '', style: { backgroundColor: config.backgroundColor } }
  }
  if (config.backgroundType === 'image' && config.backgroundImageUrl) {
    return {
      className: 'bg-cover bg-center',
      style: { backgroundImage: `url(${config.backgroundImageUrl})` },
    }
  }
  const gradient = config.backgroundGradient || 'from-[#F7E6EA] via-[#FBF3F5] to-[#F3DDE3]'
  return {
    className: `bg-gradient-to-br ${gradient} dark:from-neon-surface dark:via-neon-bg dark:to-neon-bg`,
    style: undefined,
  }
}

export function Hero({ config, animate = true, className = '' }) {
  const bg = sectionBackground(config)
  const imagePosition = config.imagePosition || 'right'
  const imageFull = imagePosition === 'center' || imagePosition === 'full'
  const imageLeft = imagePosition === 'left'
  const overlayOpacity = Number(config.overlayOpacity || 0)

  return (
    <section
      className={`relative overflow-hidden border-b border-brand-pink/30 dark:border-neon-line/10 ${
        imageFull ? 'bg-neon-bg' : bg.className
      } ${className}`}
      style={imageFull ? undefined : bg.style}
    >
      {imageFull && <HeroImage config={config} animate={animate} variant="full" />}

      {overlayOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundColor: config.overlayColor || '#000000',
            opacity: overlayOpacity,
          }}
        />
      )}

      {!imageFull && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-neon-grid opacity-30 dark:opacity-20" />
          <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-brand-pink/40 blur-[90px] dark:bg-white/[0.04]" />
          <div className="pointer-events-none absolute -right-12 bottom-0 h-64 w-64 rounded-full bg-brand-purple/20 blur-[100px] dark:bg-white/[0.03]" />
        </>
      )}

      <div
        className={`relative z-[2] mx-auto ${heightClass(config.heroHeight)} ${
          imageFull
            ? 'flex max-w-[1600px] items-center justify-center'
            : 'grid max-w-[1600px] lg:grid-cols-2'
        }`}
      >
        {imageFull ? (
          <HeroContent config={config} animate={animate} overlay />
        ) : (
          <>
            {imageLeft && <HeroImage config={config} animate={animate} />}
            <HeroContent config={config} animate={animate} />
            {!imageLeft && <HeroImage config={config} animate={animate} />}
          </>
        )}
      </div>
    </section>
  )
}
