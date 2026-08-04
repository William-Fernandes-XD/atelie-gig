import { motion } from 'framer-motion'

function radiusClass(value) {
  if (value === 'none') return 'rounded-none'
  if (value === 'md') return 'rounded-md'
  if (value === 'lg') return 'rounded-lg'
  if (value === 'xl') return 'rounded-xl'
  return 'rounded-full'
}

function SecondaryButton({ text, url, color, animate }) {
  if (!text || !url) return null
  const Comp = animate ? motion.a : 'a'
  const motionProps = animate
    ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 } }
    : {}
  return (
    <Comp
      href={url}
      {...motionProps}
      className="mt-3 inline-flex rounded-full border px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:opacity-90"
      style={{ borderColor: color || '#9B8FD9', color: color || '#9B8FD9' }}
    >
      {text}
    </Comp>
  )
}

export function HeroButtons({ config, animate = true }) {
  const {
    buttonVisible,
    buttonText,
    buttonLink,
    buttonBackground,
    buttonTextColor,
    buttonBorderRadius,
    buttonHoverBackground,
    secondaryButton1Visible,
    secondaryButton1Text,
    secondaryButton1Url,
    secondaryButton1Color,
    secondaryButton2Visible,
    secondaryButton2Text,
    secondaryButton2Url,
    secondaryButton2Color,
  } = config

  const Primary = animate ? motion.a : 'a'
  const primaryMotion = animate
    ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 } }
    : {}

  return (
    <div className="mt-5 flex flex-col items-center gap-2">
      {buttonVisible !== false && buttonText && buttonLink && (
        <Primary
          href={buttonLink}
          {...primaryMotion}
          className={`inline-flex px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-neon transition ${radiusClass(buttonBorderRadius)}`}
          style={{
            backgroundColor: buttonBackground || '#E8A8B8',
            color: buttonTextColor || '#2B2B2B',
          }}
          onMouseEnter={(e) => {
            if (buttonHoverBackground) e.currentTarget.style.backgroundColor = buttonHoverBackground
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = buttonBackground || '#E8A8B8'
          }}
        >
          {buttonText}
        </Primary>
      )}
      {secondaryButton1Visible && (
        <SecondaryButton
          text={secondaryButton1Text}
          url={secondaryButton1Url}
          color={secondaryButton1Color}
          animate={animate}
        />
      )}
      {secondaryButton2Visible && (
        <SecondaryButton
          text={secondaryButton2Text}
          url={secondaryButton2Url}
          color={secondaryButton2Color}
          animate={animate}
        />
      )}
    </div>
  )
}
