import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { PAGE_SIZE } from '../../constants/pagination'
import { formatDateTime } from '../../utils/date'
import { pageContent, pageMeta } from '../../utils/page'

const STATUS_LABELS = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  PROCESSING: 'Em preparação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

/** Cores pastel para a célula de status no admin */
const STATUS_CELL_STYLES = {
  PENDING_PAYMENT: 'bg-pink-100/90 text-pink-900',
  PAID: 'bg-blue-100/90 text-blue-900',
  PROCESSING: 'bg-amber-100/90 text-amber-900',
  SHIPPED: 'bg-sky-100/90 text-sky-900',
  DELIVERED: 'bg-green-100/90 text-green-900',
  CANCELLED: 'bg-red-100/90 text-red-900',
  REFUNDED: 'bg-gray-100 text-gray-700',
}

const STATUSES = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
const PLACEHOLDER_IMG = 'https://placehold.co/120x150/F2C4D0/2B2B2B?text=GIG'

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function productImageSrc(url) {
  if (!url) return PLACEHOLDER_IMG
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_URL || ''
  return `${base}${url}`
}

function formatAddress(shipping) {
  if (!shipping) return '—'
  const line1 = `${shipping.street}, ${shipping.number}${shipping.complement ? ` — ${shipping.complement}` : ''}`
  const line2 = `${shipping.neighborhood} — ${shipping.city}/${shipping.state}`
  return { line1, line2, cep: shipping.cep, reference: shipping.reference }
}

function ItemsModal({ order, onClose }) {
  if (!order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold">Itens do pedido</h2>
            <p className="text-sm text-brand-muted">{order.orderNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="text-brand-muted hover:text-brand-charcoal">
            ✕
          </button>
        </div>

        <ul className="mt-6 space-y-4">
          {order.items?.map((item, i) => (
            <li key={i} className="flex gap-4 rounded-xl border border-gray-100 p-3">
              <div className="h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-brand-pink/20">
                <img
                  src={productImageSrc(item.productImageUrl)}
                  alt={item.productTitle}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-brand-charcoal">{item.productTitle}</p>
                <p className="mt-1 text-brand-muted">
                  Cor: {item.colorName} · Tamanho: {item.sizeName}
                </p>
                <p className="mt-1 text-brand-muted">Quantidade: {item.quantity}</p>
                <div className="mt-3 flex justify-between gap-2">
                  <span>Unit. {formatCurrency(item.unitPrice)}</span>
                  <span className="font-semibold text-brand-purple">{formatCurrency(item.totalPrice)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm">
          <div className="flex justify-between text-brand-muted">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-brand-muted">
            <span>
              Frete{order.shippingServiceName ? ` (${order.shippingServiceName})` : ''}
            </span>
            <span>{formatCurrency(order.shippingCost || order.shipping?.cost || 0)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-brand-purple">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomerModal({ order, onClose }) {
  if (!order) return null
  const addr = formatAddress(order.shipping)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl font-bold">Dados do cliente</h2>
          <button type="button" onClick={onClose} className="text-brand-muted hover:text-brand-charcoal">
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-5 text-sm">
          <section>
            <h3 className="font-semibold text-brand-charcoal">Contato</h3>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-brand-muted">Nome</dt>
                <dd className="font-medium">{order.customerName || '—'}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">E-mail</dt>
                <dd className="font-medium break-all">{order.customerEmail || '—'}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">Telefone</dt>
                <dd className="font-medium">{order.customerPhone || '—'}</dd>
              </div>
              <div>
                <dt className="text-brand-muted">CPF</dt>
                <dd className="font-medium">{order.customerCpf || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl bg-brand-pink/10 p-4">
            <h3 className="font-semibold text-brand-charcoal">Endereço de entrega</h3>
            {typeof addr === 'string' ? (
              <p className="mt-2 text-brand-muted">—</p>
            ) : (
              <div className="mt-2 space-y-1 text-brand-charcoal/90">
                <p>{addr.line1}</p>
                <p>{addr.line2}</p>
                <p>CEP {addr.cep}</p>
                {addr.reference && <p className="text-brand-muted">Ref.: {addr.reference}</p>}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function StatusUpdateModal({ order, onClose, onConfirm, isPending }) {
  const [status, setStatus] = useState(order?.status || 'PROCESSING')
  const [observation, setObservation] = useState('')

  if (!order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold">Atualizar status</h2>
            <p className="text-sm text-brand-muted">{order.orderNumber}</p>
          </div>
          <button type="button" onClick={onClose} className="text-brand-muted hover:text-brand-charcoal">
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="label-field">Novo status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="admin-input"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Observação para o cliente</label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ex.: Saiu para entrega via Correios. Código de rastreio: BR123..."
              className="admin-input resize-none"
            />
            <p className="mt-1 text-xs text-brand-muted">
              Essa mensagem aparece no histórico do pedido do cliente.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-outline px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm({ id: order.id, status, observation })}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const queryClient = useQueryClient()
  const [itemsOrder, setItemsOrder] = useState(null)
  const [customerOrder, setCustomerOrder] = useState(null)
  const [statusOrder, setStatusOrder] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-orders', page],
    queryFn: async () =>
      (await api.get(`/api/orders?size=${PAGE_SIZE}&page=${page}&sort=createdAt,desc`)).data,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-order-categories'],
    queryFn: async () => (await api.get('/api/categories?size=100&sort=name,asc')).data,
  })

  const categories = pageContent(categoriesData)
  const meta = pageMeta(data)

  useEffect(() => {
    setPage(0)
  }, [search, categoryFilter])

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, observation }) =>
      (await api.patch(`/api/orders/${id}/status`, {
        status,
        observation: observation?.trim() || null,
      })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      setStatusOrder(null)
    },
  })

  const orders = useMemo(() => {
    const list = data?.content || []
    const seen = new Set()
    return list
      .filter((o) => {
        if (!o?.id || seen.has(o.id)) return false
        seen.add(o.id)
        return true
      })
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  }, [data])

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const matchesCategory = !categoryFilter
        || (o.items || []).some((item) => {
          if (item.categoryId != null && String(item.categoryId) === String(categoryFilter)) {
            return true
          }
          const selected = categories.find((c) => String(c.id) === String(categoryFilter))
          return selected && item.categoryName === selected.name
        })

      if (!matchesCategory) return false
      if (!q) return true

      const statusLabel = (STATUS_LABELS[o.status] || o.status || '').toLowerCase()
      const itemText = (o.items || [])
        .map((item) => [item.productTitle, item.categoryName, item.colorName, item.sizeName].filter(Boolean).join(' '))
        .join(' ')

      const haystack = [
        o.orderNumber,
        o.customerName,
        o.customerEmail,
        o.customerPhone,
        o.customerCpf,
        o.paymentMethod,
        statusLabel,
        itemText,
        o.shipping?.city,
        o.shipping?.neighborhood,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [orders, search, categoryFilter, categories])

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold">Pedidos</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Identifique as peças pelas fotos, gerencie status e entrega.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[220px] flex-1">
          <label className="label-field" htmlFor="order-search">
            Pesquisar pedidos
          </label>
          <input
            id="order-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nº, cliente, produto, status..."
            className="admin-input"
          />
        </div>
        <div className="min-w-[200px] sm:w-64">
          <label className="label-field" htmlFor="order-category">
            Categoria do produto
          </label>
          <select
            id="order-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="admin-input"
          >
            <option value="">Todas as categorias</option>
            {categories
              .filter((c) => c.slug !== 'sem-categoria')
              .map((c) => (
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

      {(search.trim() || categoryFilter) && !isLoading && !error && (
        <p className="mt-3 text-xs text-brand-muted">
          {filteredOrders.length} pedido(s) encontrado(s)
          {categoryFilter
            ? ` na categoria “${categories.find((c) => String(c.id) === String(categoryFilter))?.name || ''}”`
            : ''}
          {search.trim() ? ` para “${search.trim()}”` : ''}
        </p>
      )}

      {isLoading ? (
        <p className="mt-6">Carregando...</p>
      ) : error ? (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <p className="font-medium">Erro ao carregar pedidos.</p>
          <p className="mt-1">
            {error.response?.status === 401 || error.response?.status === 403
              ? 'Sua sessão expirou ou você não tem permissão. Faça login novamente como admin.'
              : 'Verifique se o backend está no ar e se você está logado como admin.'}
          </p>
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-6 admin-table-empty">Nenhum pedido encontrado.</p>
      ) : filteredOrders.length === 0 ? (
        <p className="mt-6 admin-table-empty">Nenhum pedido corresponde aos filtros nesta página.</p>
      ) : (
        <>
          <div className="admin-table-wrap mt-8">
            <table className="admin-table min-w-[1320px] text-center">
              <thead>
                <tr>
                  <th className="text-center">Nº Pedido</th>
                  <th className="text-center">Cliente</th>
                  <th className="text-center">Peças (fotos)</th>
                  <th className="text-center">Endereço de entrega</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Atualizar</th>
                  <th className="text-center">Pagamento</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const addr = formatAddress(o.shipping)
                  const previewItems = (o.items || []).slice(0, 3)
                  const extraCount = Math.max((o.items?.length || 0) - previewItems.length, 0)

                  return (
                    <tr key={o.id}>
                      <td className="font-medium">{o.orderNumber}</td>
                      <td>
                        <div className="flex flex-col items-center justify-center">
                          <p>{o.customerName}</p>
                          <p className="text-xs text-brand-muted">{o.customerEmail}</p>
                          <button
                            type="button"
                            onClick={() => setCustomerOrder(o)}
                            className="mt-1 text-xs font-semibold text-brand-purple hover:underline"
                          >
                            Ver dados e endereço
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center gap-2">
                            {previewItems.map((item, i) => (
                              <div
                                key={i}
                                className="h-16 w-12 overflow-hidden rounded-md border border-brand-pink/40 bg-brand-pink/20"
                                title={`${item.productTitle} · ${item.colorName}/${item.sizeName} × ${item.quantity}`}
                              >
                                <img
                                  src={productImageSrc(item.productImageUrl)}
                                  alt={item.productTitle}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                            {extraCount > 0 && (
                              <span className="rounded-md bg-brand-pink/30 px-2 py-1 text-xs font-medium text-brand-muted">
                                +{extraCount}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-brand-muted">
                            {o.items?.length || 0} peça(s)
                          </p>
                          <button
                            type="button"
                            onClick={() => setItemsOrder(o)}
                            className="mt-1 text-xs font-semibold text-brand-purple hover:underline"
                          >
                            Ver pedido completo
                          </button>
                        </div>
                      </td>
                      <td>
                        {typeof addr === 'string' ? (
                          <span className="text-brand-muted">—</span>
                        ) : (
                          <div className="mx-auto max-w-[220px] text-xs leading-relaxed">
                            <p>{addr.line1}</p>
                            <p>{addr.line2}</p>
                            <p className="text-brand-muted">CEP {addr.cep}</p>
                            {addr.reference && (
                              <p className="text-brand-muted">Ref.: {addr.reference}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td
                        className={`whitespace-nowrap ${STATUS_CELL_STYLES[o.status] || 'bg-brand-pink/20 text-brand-charcoal'}`}
                      >
                        <span className="text-xs font-semibold">
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setStatusOrder(o)}
                          className="rounded-full border border-brand-pink/50 bg-white px-3 py-1.5 text-xs font-medium text-brand-charcoal hover:bg-brand-pink/40"
                        >
                          Atualizar status
                        </button>
                      </td>
                      <td>{o.paymentMethod || '—'}</td>
                      <td className="font-semibold text-brand-purple">{formatCurrency(o.total)}</td>
                      <td className="whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                    </tr>
                  )
                })}
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

      <ItemsModal order={itemsOrder} onClose={() => setItemsOrder(null)} />
      <CustomerModal order={customerOrder} onClose={() => setCustomerOrder(null)} />
      <StatusUpdateModal
        key={statusOrder?.id || 'closed'}
        order={statusOrder}
        onClose={() => setStatusOrder(null)}
        onConfirm={(payload) => statusMutation.mutate(payload)}
        isPending={statusMutation.isPending}
      />
    </div>
  )
}
