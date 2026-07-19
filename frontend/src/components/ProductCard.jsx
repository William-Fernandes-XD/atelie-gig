import { Link } from 'react-router-dom'

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
    : 'https://placehold.co/400x500/F2C4D0/2B2B2B?text=GIG'

  const installment = installmentLine(product.price)

  if (compact) {
    return (
      <article className="group overflow-hidden rounded-lg border border-gray-100 bg-white transition hover:border-brand-pink/60 hover:shadow-sm">
        <Link to={`/produto/${product.id}`} className="block">
          <div className="aspect-square overflow-hidden bg-brand-pink/20">
            <img
              src={imageUrl}
              alt={product.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="space-y-1.5 px-2 py-3 text-center font-sans">
            <h3 className="line-clamp-2 min-h-[2.25rem] text-[11px] font-medium leading-snug tracking-wide text-brand-charcoal sm:text-xs">
              {product.title}
            </h3>
            <p className="text-sm font-bold tracking-tight text-brand-charcoal sm:text-base">
              {formatCurrency(product.price)}
            </p>
            {installment && (
              <p className="text-[10px] font-normal leading-snug text-brand-muted sm:text-[11px]">
                ou {installment.count}x de{' '}
                <span className="font-bold text-brand-charcoal">{installment.value}</span>
                {' '}Sem juros
              </p>
            )}
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/produto/${product.id}`}>
        <div className="aspect-[3/4] overflow-hidden bg-brand-pink/30">
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="space-y-2 p-4 text-center font-sans">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug tracking-wide text-brand-charcoal sm:text-base">
            {product.title}
          </h3>
          <p className="text-lg font-bold tracking-tight text-brand-charcoal sm:text-xl">
            {formatCurrency(product.price)}
          </p>
          {installment && (
            <p className="text-xs font-normal text-brand-muted sm:text-sm">
              ou {installment.count}x de{' '}
              <span className="font-bold text-brand-charcoal">{installment.value}</span>
              {' '}Sem juros
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}

export const PRODUCT_GRID_CLASS =
  'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7'
