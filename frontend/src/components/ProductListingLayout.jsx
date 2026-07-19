import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { ProductCard } from './ProductCard'

import { PAGE_SIZE } from '../constants/pagination'

function parseListParam(value) {
  return value ? value.split(',').map((v) => v.trim()).filter(Boolean) : []
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-brand-charcoal"
      >
        {title}
        <span className="text-brand-muted">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  )
}

function CheckboxOption({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-charcoal hover:text-brand-purple">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-brand-purple focus:ring-brand-purple/30"
      />
      <span className="flex-1 truncate">{label}</span>
    </label>
  )
}

export function useProductFilters(fixedCategoryId = null) {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedCategoryIds = fixedCategoryId
    ? [String(fixedCategoryId)]
    : parseListParam(searchParams.get('categories'))

  const selectedColors = parseListParam(searchParams.get('colors'))
  const selectedSizes = parseListParam(searchParams.get('sizes'))
  const search = searchParams.get('q') || ''
  const sort = searchParams.get('sort') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    !!sort ||
    !!minPrice ||
    !!maxPrice ||
    (!fixedCategoryId && selectedCategoryIds.length > 0)

  const activeFilterCount =
    selectedColors.length +
    selectedSizes.length +
    (sort ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (!fixedCategoryId && selectedCategoryIds.length > 0 ? selectedCategoryIds.length : 0)

  const setScalarParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (!value) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  const updateParam = (key, values) => {
    const next = new URLSearchParams(searchParams)
    if (values.length === 0) {
      next.delete(key)
    } else {
      next.set(key, values.join(','))
    }
    setSearchParams(next, { replace: true })
  }

  const toggleValue = (key, value, current) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    updateParam(key, next)
  }

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams)
    if (!fixedCategoryId) {
      next.delete('categories')
    }
    next.delete('colors')
    next.delete('sizes')
    next.delete('sort')
    next.delete('minPrice')
    next.delete('maxPrice')
    setSearchParams(next, { replace: true })
  }

  const buildApiParams = (page = 0) => {
    const params = new URLSearchParams({
      size: String(PAGE_SIZE),
      page: String(page),
    })
    if (search) params.set('search', search)
    if (fixedCategoryId) {
      params.set('categoryId', fixedCategoryId)
    } else {
      selectedCategoryIds.forEach((id) => params.append('categoryIds', id))
    }
    selectedColors.forEach((color) => params.append('colors', color))
    selectedSizes.forEach((size) => params.append('sizes', size))
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (sort) params.set('sort', sort)
    return params
  }

  const filterQueryString = useMemo(() => {
    const params = new URLSearchParams()
    if (selectedColors.length) params.set('colors', selectedColors.join(','))
    if (selectedSizes.length) params.set('sizes', selectedSizes.join(','))
    if (sort) params.set('sort', sort)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    const str = params.toString()
    return str ? `?${str}` : ''
  }, [selectedColors, selectedSizes, sort, minPrice, maxPrice])

  const queryKey = useMemo(
    () => [
      'products',
      fixedCategoryId,
      search,
      selectedCategoryIds.join(','),
      selectedColors.join(','),
      selectedSizes.join(','),
      sort,
      minPrice,
      maxPrice,
    ],
    [
      fixedCategoryId,
      search,
      selectedCategoryIds,
      selectedColors,
      selectedSizes,
      sort,
      minPrice,
      maxPrice,
    ],
  )

  return {
    search,
    sort,
    minPrice,
    maxPrice,
    selectedCategoryIds,
    selectedColors,
    selectedSizes,
    hasActiveFilters,
    activeFilterCount,
    queryKey,
    filterQueryString,
    buildApiParams,
    setSort: (value) => setScalarParam('sort', value),
    setMinPrice: (value) => setScalarParam('minPrice', value),
    setMaxPrice: (value) => setScalarParam('maxPrice', value),
    toggleCategory: (id) => toggleValue('categories', String(id), selectedCategoryIds),
    toggleColor: (color) => toggleValue('colors', color, selectedColors),
    toggleSize: (size) => toggleValue('sizes', size, selectedSizes),
    clearFilters,
  }
}

function ProductFiltersPanel({ fixedCategoryId = null }) {
  const navigate = useNavigate()
  const {
    selectedCategoryIds,
    selectedColors,
    selectedSizes,
    sort,
    minPrice,
    maxPrice,
    hasActiveFilters,
    filterQueryString,
    setSort,
    setMinPrice,
    setMaxPrice,
    toggleCategory,
    toggleColor,
    toggleSize,
    clearFilters,
  } = useProductFilters(fixedCategoryId)

  const [localMinPrice, setLocalMinPrice] = useState(minPrice)
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice)

  useEffect(() => {
    setLocalMinPrice(minPrice)
    setLocalMaxPrice(maxPrice)
  }, [minPrice, maxPrice])

  const { data: options } = useQuery({
    queryKey: ['product-filters', fixedCategoryId],
    queryFn: async () => {
      const params = fixedCategoryId ? `?categoryId=${fixedCategoryId}` : ''
      return (await api.get(`/api/products/filters${params}`)).data
    },
  })

  const handleCategoryToggle = (categoryId) => {
    const id = String(categoryId)
    if (fixedCategoryId) {
      if (String(fixedCategoryId) === id) {
        navigate('/')
        return
      }
      navigate(`/categoria/${id}${filterQueryString}`)
      return
    }
    toggleCategory(categoryId)
  }

  const applyPriceFilter = () => {
    setMinPrice(localMinPrice.trim())
    setMaxPrice(localMaxPrice.trim())
  }

  const clearPriceFilter = () => {
    setLocalMinPrice('')
    setLocalMaxPrice('')
    setMinPrice('')
    setMaxPrice('')
  }

  return (
    <aside className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-brand-charcoal">Filtros</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-brand-purple hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      <FilterSection title="Ordenar por">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-brand-charcoal focus:border-brand-purple/40 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
        >
          <option value="">Mais recentes</option>
          <option value="price,asc">Menor preço</option>
          <option value="price,desc">Maior preço</option>
          <option value="title,asc">Nome (A–Z)</option>
        </select>
      </FilterSection>

      <FilterSection title="Preço">
        {options?.minPrice != null && options?.maxPrice != null && (
          <p className="mb-2 text-xs text-brand-muted">
            Faixa disponível: {formatCurrency(options.minPrice)} – {formatCurrency(options.maxPrice)}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-brand-muted">
            De (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-brand-charcoal focus:border-brand-purple/40 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
            />
          </label>
          <label className="text-xs text-brand-muted">
            Até (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              placeholder="999"
              className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-brand-charcoal focus:border-brand-purple/40 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
            />
          </label>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={applyPriceFilter}
            className="flex-1 rounded-lg bg-brand-purple px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Aplicar
          </button>
          {(minPrice || maxPrice) && (
            <button
              type="button"
              onClick={clearPriceFilter}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-brand-muted hover:border-brand-pink"
            >
              Limpar
            </button>
          )}
        </div>
      </FilterSection>

      <FilterSection title="Categorias">
        {!options?.categories?.length ? (
          <p className="text-xs text-brand-muted">Nenhuma categoria</p>
        ) : (
          options.categories.map((cat) => {
            const checked = selectedCategoryIds.includes(String(cat.id))
            return (
              <CheckboxOption
                key={cat.id}
                label={cat.name}
                checked={checked}
                onChange={() => handleCategoryToggle(cat.id)}
              />
            )
          })
        )}
      </FilterSection>

      <FilterSection title="Cores">
        {!options?.colors?.length ? (
          <p className="text-xs text-brand-muted">Nenhuma cor disponível</p>
        ) : (
          options.colors.map((color) => (
            <CheckboxOption
              key={color}
              label={color}
              checked={selectedColors.includes(color)}
              onChange={() => toggleColor(color)}
            />
          ))
        )}
      </FilterSection>

      <FilterSection title="Tamanho">
        {!options?.sizes?.length ? (
          <p className="text-xs text-brand-muted">Nenhum tamanho disponível</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {options.sizes.map((size) => {
              const active = selectedSizes.includes(size)
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`min-w-[2.25rem] rounded-md border px-2 py-1 text-xs font-medium transition ${
                    active
                      ? 'border-brand-purple bg-brand-purple text-white'
                      : 'border-gray-200 bg-white text-brand-charcoal hover:border-brand-pink'
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        )}
      </FilterSection>
    </aside>
  )
}

export function ProductListingLayout({
  fixedCategoryId = null,
  hero,
  listingId,
  emptyMessage = 'Nenhum produto encontrado.',
  loadingMessage = 'Carregando produtos...',
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const {
    queryKey,
    buildApiParams,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
  } = useProductFilters(fixedCategoryId)

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) =>
      (await api.get(`/api/products?${buildApiParams(pageParam)}`)).data,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
    initialPageParam: 0,
  })

  const products = data?.pages.flatMap((page) => page.content) || []
  const total = data?.pages[0]?.totalElements ?? products.length

  return (
    <div>
      {hero}

      <section id={listingId} className="mx-auto max-w-[1600px] scroll-mt-28 px-3 py-6 sm:px-4 lg:px-6">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-brand-charcoal shadow-sm"
          >
            Filtrar
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-brand-purple px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <p className="text-sm text-brand-muted">
            {products.length} de {total}
          </p>
        </div>

        <div className="flex gap-6">
          <div className="hidden w-56 shrink-0 lg:block xl:w-60">
            <div className="sticky top-36">
              <ProductFiltersPanel fixedCategoryId={fixedCategoryId} />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-4 hidden items-center justify-between lg:flex">
              <p className="text-sm text-brand-muted">
                Exibindo {products.length} de {total} produto{total !== 1 ? 's' : ''}
              </p>
            </div>

            {isLoading ? (
              <p className="py-16 text-center text-brand-muted">{loadingMessage}</p>
            ) : isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 py-16 text-center">
                <p className="text-red-600">Não foi possível carregar os produtos. Tente recarregar a página.</p>
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
                <p className="text-brand-muted">{emptyMessage}</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-sm text-brand-purple hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {hasNextPage && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="btn-outline min-w-[200px] px-8 py-3 text-sm disabled:opacity-50"
                    >
                      {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Fechar filtros"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Filtros</h2>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="text-brand-muted">
                Fechar
              </button>
            </div>
            <ProductFiltersPanel fixedCategoryId={fixedCategoryId} />
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-primary mt-4 w-full"
            >
              Ver resultados
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
