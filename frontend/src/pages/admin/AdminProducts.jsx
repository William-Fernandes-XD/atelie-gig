import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { ProductForm } from '../../components/admin/ProductForm'
import { PAGE_SIZE } from '../../constants/pagination'
import { pageContent, pageMeta } from '../../utils/page'

const PLACEHOLDER_IMG = 'https://placehold.co/120x150/F2C4D0/2B2B2B?text=GIG'

function productImageSrc(url) {
  if (!url) return PLACEHOLDER_IMG
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_URL || ''
  return `${base}${url}`
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: async () =>
      (await api.get(`/api/products/admin/all?size=${PAGE_SIZE}&page=${page}&sort=createdAt,desc`)).data,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-product-categories'],
    queryFn: async () => (await api.get('/api/categories?size=100&sort=name,asc')).data,
  })

  const products = pageContent(data)
  const meta = pageMeta(data)
  const categories = pageContent(categoriesData).filter((c) => c.slug !== 'sem-categoria')

  useEffect(() => {
    setPage(0)
  }, [search, categoryFilter])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesCategory = !categoryFilter || String(p.categoryId) === String(categoryFilter)
      if (!matchesCategory) return false
      if (!q) return true

      const haystack = [
        p.title,
        p.slug,
        p.categoryName,
        p.active ? 'ativo' : 'inativo',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [products, search, categoryFilter])

  const deactivateMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      setMessage('Produto desativado.')
    },
  })

  const openCreate = () => {
    setEditingProduct(null)
    setShowForm(true)
    setMessage('')
  }

  const openEdit = async (id) => {
    setMessage('')
    const { data: product } = await api.get(`/api/products/${id}`)
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleSaved = (saved) => {
    setMessage(
      editingProduct
        ? `Produto "${saved.title}" atualizado com sucesso!`
        : `Produto "${saved.title}" cadastrado com sucesso!`,
    )
    setShowForm(false)
    setEditingProduct(null)
    queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="admin-page-title">Produtos</h1>
          <p className="admin-page-sub">
            Cadastre vestidos, blusas, calças e gerencie preços e estoque.
          </p>
        </div>
        {!showForm && (
          <button type="button" onClick={openCreate} className="btn-primary shrink-0">
            + Novo produto
          </button>
        )}
      </div>

      {message && (
        <div className="mb-4 admin-alert-ok">{message}</div>
      )}

      {showForm && (
        <div className="mb-10">
          <ProductForm
            product={editingProduct}
            onSaved={handleSaved}
            onCancel={() => {
              setShowForm(false)
              setEditingProduct(null)
            }}
          />
        </div>
      )}

      {!showForm && (
        <div className="mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[220px] flex-1 sm:max-w-md">
              <label className="label-field" htmlFor="product-search">
                Pesquisar produtos
              </label>
              <input
                id="product-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, slug ou status..."
                className="admin-input"
              />
            </div>
            <div className="min-w-[200px] sm:w-64">
              <label className="label-field" htmlFor="product-category">
                Categoria
              </label>
              <select
                id="product-category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="admin-input"
              >
                <option value="">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {(search.trim() || categoryFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCategoryFilter('')
                }}
                className="btn-outline px-4 py-2.5 text-sm"
              >
                Limpar filtros
              </button>
            )}
          </div>
          {(search.trim() || categoryFilter) && (
            <p className="mt-2 text-xs text-brand-muted">
              {filteredProducts.length} resultado(s) nesta página
              {categoryFilter
                ? ` em “${categories.find((c) => String(c.id) === String(categoryFilter))?.name || 'categoria'}”`
                : ''}
              {search.trim() ? ` para “${search.trim()}”` : ''}
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-brand-muted">Carregando produtos...</p>
      ) : products.length === 0 ? (
        <p className="admin-table-empty">
          Nenhum produto cadastrado. Clique em &quot;Novo produto&quot; para começar.
        </p>
      ) : filteredProducts.length === 0 ? (
        <p className="admin-table-empty">Nenhum produto encontrado com esse filtro nesta página.</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Atacado</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => openEdit(p.id)}
                        className="block h-20 w-16 overflow-hidden rounded-xl bg-brand-pink/20 shadow-sm ring-1 ring-brand-pink/40 transition hover:ring-brand-pink-dark dark:ring-neon-line/20"
                        title={`Ver ${p.title}`}
                      >
                        <img
                          src={productImageSrc(p.mainImageUrl)}
                          alt={p.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    </td>
                    <td>
                      <p className="font-medium text-neon-text">{p.title}</p>
                      {p.slug && (
                        <p className="mt-0.5 text-xs text-neon-muted">{p.slug}</p>
                      )}
                    </td>
                    <td>
                      <span className="admin-badge">
                        {p.categoryName || '—'}
                      </span>
                    </td>
                    <td className="font-semibold text-brand-purple dark:text-brand-pink">
                      {formatCurrency(p.price)}
                    </td>
                    <td className="text-neon-muted">
                      {formatCurrency(p.wholesalePrice)}
                    </td>
                    <td>
                      <span
                        className={p.active ? 'admin-badge' : 'admin-badge-muted'}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${p.active ? 'bg-brand-pink-dark dark:bg-brand-pink' : 'bg-neon-muted'}`}
                          aria-hidden
                        />
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(p.id)}
                          className="admin-btn-soft"
                        >
                          Editar
                        </button>
                        {p.active && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Desativar "${p.title}"?`)) {
                                deactivateMutation.mutate(p.id)
                              }
                            }}
                            className="admin-btn-danger"
                          >
                            Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            page={meta.page}
            totalPages={meta.totalPages}
            totalElements={meta.totalElements}
            size={meta.size}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
