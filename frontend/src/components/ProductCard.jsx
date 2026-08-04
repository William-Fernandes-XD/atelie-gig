import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function installmentLine(price) {
  const total = Number(price || 0)
  if (!total) return null
  const installment = total / 4
  return {
    count: 4,
    value: formatCurrency(installment),
  }
}

export function ProductCard({ product, compact = true }) {
  const imageUrl = product.mainImageUrl
    ? `${import.meta.env.VITE_API_URL || ''}${product.mainImageUrl}`
    : 'https://placehold.co/400x500/12121C/FF3D9A?text=GIG'

  const installment = installmentLine(product.price)

  const body = (
    <>
      <div className={`overflow-hidden bg-neon-card ${compact ? 'aspect-square' : 'aspect-[3/4]'}`}>
        <img
          src={imageUrl}
          alt={product.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>
      <div className={`space-y-1.5 text-center ${compact ? 'px-2 py-3' : 'space-y-2 p-4'}`}>
        <h3
          className={`line-clamp-2 font-medium leading-snug tracking-wide text-neon-text ${
            compact ? 'min-h-[2.25rem] text-[11px] sm:text-xs' : 'text-sm sm:text-base'
          }`}
        >
          {product.title}
        </h3>
        <p
          className={`font-bold tracking-tight text-brand-charcoal dark:text-brand-pink ${
            compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
          }`}
        >
          {formatCurrency(product.price)}
        </p>
        {installment && (
          <p className={`font-normal leading-snug text-neon-muted ${compact ? 'text-[10px] sm:text-[11px]' : 'text-xs sm:text-sm'}`}>
            ou {installment.count}x de{' '}
            <span className="font-bold text-neon-text">{installment.value}</span>
            {' '}Sem juros
          </p>
        )}
      </div>
    </>
  )

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
      className={`group overflow-hidden border border-brand-pink/30 bg-neon-surface transition hover:border-brand-pink hover:shadow-neon dark:border-neon-line/10 dark:hover:border-brand-pink/40 ${
        compact ? 'rounded-xl' : 'rounded-2xl'
      }`}
    >
      <Link to={`/produto/${product.id}`} className="block">
        {body}
      </Link>
    </motion.article>
  )
}

export const PRODUCT_GRID_CLASS =
  'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
