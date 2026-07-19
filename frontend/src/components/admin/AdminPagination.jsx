import { PAGE_SIZE } from '../../constants/pagination'

/**
 * Controles de paginação no tema rosa pastel.
 * Aceita metadados de Spring Page ou total/page manuais.
 */
export function AdminPagination({
  page = 0,
  totalPages = 0,
  totalElements = 0,
  size = PAGE_SIZE,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1 && totalElements <= size) return null

  const safeTotalPages = Math.max(totalPages, 1)
  const current = Math.min(Math.max(page, 0), safeTotalPages - 1)
  const from = totalElements === 0 ? 0 : current * size + 1
  const to = Math.min((current + 1) * size, totalElements)

  const go = (next) => {
    if (!onPageChange) return
    if (next < 0 || next >= safeTotalPages || next === current) return
    onPageChange(next)
  }

  return (
    <div
      className={`admin-pagination ${className}`.trim()}
      role="navigation"
      aria-label="Paginação"
    >
      <p className="text-xs text-brand-muted sm:text-sm">
        {totalElements === 0
          ? 'Nenhum registro'
          : `Exibindo ${from}–${to} de ${totalElements}`}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="admin-page-btn"
          disabled={current <= 0}
          onClick={() => go(current - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </button>

        <span className="min-w-[5.5rem] text-center text-sm font-medium text-brand-charcoal">
          {current + 1} / {safeTotalPages}
        </span>

        <button
          type="button"
          className="admin-page-btn"
          disabled={current >= safeTotalPages - 1}
          onClick={() => go(current + 1)}
          aria-label="Próxima página"
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
