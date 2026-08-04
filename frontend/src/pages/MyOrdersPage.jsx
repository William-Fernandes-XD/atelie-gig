import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { AdminPagination } from '../components/admin/AdminPagination'
import { PAGE_SIZE } from '../constants/pagination'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { formatDateTime } from '../utils/date'
import { pageMeta } from '../utils/page'
import { invalidateStockRelatedQueries } from '../lib/queryClient'

const STATUS_LABELS = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  PROCESSING: 'Em preparação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
}

const STATUS_STYLES = {
  PENDING_PAYMENT: 'bg-pink-100 text-pink-800',
  PAID: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-amber-100 text-amber-800',
  SHIPPED: 'bg-sky-100 text-sky-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
}

const TRACK_STEPS = [
  { key: 'PENDING_PAYMENT', label: 'Pedido feito' },
  { key: 'PAID', label: 'Pagamento' },
  { key: 'PROCESSING', label: 'Preparação' },
  { key: 'SHIPPED', label: 'A caminho' },
  { key: 'DELIVERED', label: 'Entregue' },
]

const PLACEHOLDER_IMG = 'https://placehold.co/160x200/F2C4D0/2B2B2B?text=GIG'

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function productImageSrc(url) {
  if (!url) return PLACEHOLDER_IMG
  if (url.startsWith('http')) return url
  const base = import.meta.env.VITE_API_URL || ''
  return `${base}${url}`
}

function getStepIndex(status) {
  const idx = TRACK_STEPS.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : -1
}

function OrderProgressTracker({ status }) {
  const isTerminalNegative = status === 'CANCELLED' || status === 'REFUNDED'
  const currentIndex = getStepIndex(status)

  if (isTerminalNegative) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        {STATUS_LABELS[status]}
      </div>
    )
  }

  return (
    <div className="order-progress" aria-label="Progresso do pedido">
      <ol className="relative flex justify-between gap-1">
        {TRACK_STEPS.map((step, index) => {
          const done = currentIndex > index
          const current = currentIndex === index
          const pending = currentIndex < index

          return (
            <li key={step.key} className="relative z-[1] flex flex-1 flex-col items-center text-center">
              {index < TRACK_STEPS.length - 1 && (
                <span
                  className={`absolute left-[50%] top-3.5 h-0.5 w-full origin-left ${
                    done ? 'bg-brand-purple order-progress-line-fill' : 'bg-gray-200'
                  }`}
                  aria-hidden
                />
              )}
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-500 ${
                  done
                    ? 'border-brand-purple bg-brand-purple text-white'
                    : current
                      ? 'order-progress-pulse border-brand-purple bg-white text-brand-purple'
                      : 'border-gray-200 bg-white text-gray-300'
                }`}
              >
                {done ? '✓' : index + 1}
              </span>
              <span
                className={`mt-2 text-[11px] leading-tight sm:text-xs ${
                  pending ? 'text-gray-400' : 'font-medium text-brand-charcoal'
                }`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function OrderHistoryTimeline({ history = [] }) {
  if (!history.length) {
    return <p className="text-sm text-brand-muted">Nenhum evento registrado ainda.</p>
  }

  const events = [...history].reverse()

  return (
    <ol className="relative space-y-4 border-l-2 border-brand-pink/50 pl-5">
      {events.map((event, index) => (
        <li key={event.id || `${event.status}-${event.createdAt}-${index}`} className="relative">
          <span
            className={`absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm ${
              index === 0 ? 'bg-brand-purple order-progress-pulse' : 'bg-brand-pink'
            }`}
          />
          <div className="rounded-xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-semibold text-brand-charcoal">
              {STATUS_LABELS[event.status] || event.status}
            </p>
            <p className="mt-0.5 text-xs text-brand-muted">{formatDateTime(event.createdAt)}</p>
            {event.observation && (
              <p className="mt-1.5 text-sm leading-relaxed text-brand-charcoal/80">{event.observation}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

function OrderItemsList({ items = [] }) {
  if (!items.length) {
    return <p className="text-sm text-brand-muted">Nenhum item neste pedido.</p>
  }

  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li
          key={`${item.productId || item.productTitle}-${i}`}
          className="flex gap-3 rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5"
        >
          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-pink/20">
            <img
              src={productImageSrc(item.productImageUrl)}
              alt={item.productTitle}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-snug text-brand-charcoal">{item.productTitle}</p>
            <p className="mt-1 text-xs text-brand-muted">
              Cor: {item.colorName} · Tamanho: {item.sizeName}
            </p>
            <p className="mt-1 text-xs text-brand-muted">Quantidade: {item.quantity}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-brand-muted">Unit. {formatCurrency(item.unitPrice)}</span>
              <span className="font-semibold text-brand-purple">{formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function OrderAccordion({ order, openPaymentModal, onCancelOrder, cancellingId }) {
  const [open, setOpen] = useState(false)
  const awaitingPayment = order.status === 'PENDING_PAYMENT' || order.canPay
  const isCancelling = cancellingId === order.id

  return (
    <article className="overflow-hidden rounded-2xl border border-brand-pink/30 bg-white shadow-sm">
      <div className="px-5 pt-4 sm:px-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 text-left"
          aria-expanded={open}
        >
          <div className="min-w-0">
            <p className="font-serif text-xl font-bold text-brand-charcoal">
              {formatCurrency(order.total)}
            </p>
            <p className="mt-1 text-sm text-brand-muted">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-brand-pink/30 text-brand-charcoal transition ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden
            >
              ▾
            </span>
          </div>
        </button>

        <div className="mt-4 pb-4">
          <OrderProgressTracker status={order.status} />
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 text-xs font-medium text-brand-purple hover:underline"
            >
              Ver detalhes do pedido
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-brand-pink/20 px-5 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-brand-muted">
              Ref. {order.orderNumber}
              {order.paymentMethod ? ` · ${order.paymentMethod}` : ''}
              {` · ${order.items?.length || 0} peça(s)`}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section>
              <h3 className="mb-3 font-serif text-lg font-semibold">Peças do pedido</h3>
              <OrderItemsList items={order.items} />
            </section>

            <section className="space-y-5">
              <div>
                <h3 className="mb-3 font-serif text-lg font-semibold">Histórico</h3>
                <OrderHistoryTimeline history={order.statusHistory} />
              </div>

              {order.shipping && (
                <div className="rounded-xl bg-brand-pink/10 p-4 text-sm">
                  <p className="font-semibold">Entrega</p>
                  <p className="mt-1 leading-relaxed text-brand-muted">
                    {order.shipping.street}, {order.shipping.number}
                    {order.shipping.complement ? ` — ${order.shipping.complement}` : ''}
                    <br />
                    {order.shipping.neighborhood} — {order.shipping.city}/{order.shipping.state}
                    <br />
                    CEP {order.shipping.cep}
                    {order.shipping.reference ? (
                      <>
                        <br />
                        Ref.: {order.shipping.reference}
                      </>
                    ) : null}
                  </p>
                  {(order.shippingServiceName || order.shipping?.serviceName) && (
                    <p className="mt-2 text-brand-charcoal">
                      Frete: {order.shippingServiceName || order.shipping?.serviceName}
                      {' · '}
                      {formatCurrency(order.shippingCost ?? order.shipping?.cost ?? 0)}
                      {(order.shippingDeadlineDays || order.shipping?.deadlineDays)
                        ? ` · ${order.shippingDeadlineDays || order.shipping?.deadlineDays} dia(s)`
                        : ''}
                    </p>
                  )}
                  <div className="mt-2 space-y-0.5 border-t border-brand-pink/20 pt-2 text-brand-muted">
                    <p className="flex justify-between">
                      <span>Produtos</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </p>
                    <p className="flex justify-between font-semibold text-brand-charcoal">
                      <span>Total pago</span>
                      <span>{formatCurrency(order.total)}</span>
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {awaitingPayment && (
            <div className="mt-5 flex flex-wrap gap-3">
              {order.canPay && (
                <button
                  type="button"
                  onClick={() => openPaymentModal(order.id)}
                  disabled={isCancelling}
                  className="btn-primary text-sm"
                >
                  Pagar agora
                </button>
              )}
              <button
                type="button"
                onClick={() => onCancelOrder(order)}
                disabled={isCancelling}
                className="rounded-full border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {isCancelling ? 'Cancelando...' : 'Cancelar pedido'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

export default function MyOrdersPage() {
  const token = useAuthStore((s) => s.token)
  const openPaymentModal = useUiStore((s) => s.openPaymentModal)
  const showToast = useUiStore((s) => s.showToast)
  const queryClient = useQueryClient()
  const [cancellingId, setCancellingId] = useState(null)
  const [page, setPage] = useState(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: async () =>
      (await api.get(`/api/orders/my?size=${PAGE_SIZE}&page=${page}&sort=createdAt,desc`)).data,
    enabled: !!token,
  })

  const handleCancelOrder = async (order) => {
    const confirmed = window.confirm(
      'Cancelar este pedido? Se houver PIX gerado, ele será invalidado e o estoque será liberado.',
    )
    if (!confirmed) return

    setCancellingId(order.id)
    try {
      await api.post(`/api/orders/${order.id}/cancel`)
      await queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      invalidateStockRelatedQueries(queryClient)
      showToast({
        type: 'info',
        message: 'Pedido cancelado com sucesso.',
      })
    } catch (err) {
      showToast({
        type: 'error',
        message: err.response?.data?.message || 'Não foi possível cancelar o pedido.',
      })
    } finally {
      setCancellingId(null)
    }
  }

  if (!token) {
    return <Navigate to="/?login=1" replace />
  }

  const meta = pageMeta(data)
  const orders = (() => {
    const list = data?.content || []
    const seen = new Set()
    return list
      .filter((o) => {
        if (!o?.id || seen.has(o.id)) return false
        seen.add(o.id)
        return true
      })
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  })()

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-brand-pink/15 via-white to-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-bold">Meus pedidos</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Acompanhe o status na barrinha e toque para ver os detalhes do pedido.
        </p>

        {isLoading ? (
          <p className="mt-8">Carregando pedidos...</p>
        ) : error ? (
          <p className="mt-8 text-red-500">Erro ao carregar pedidos.</p>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-brand-pink/40 bg-white/70 py-16 text-center">
            <p className="text-brand-muted">Você ainda não fez nenhum pedido.</p>
            <Link to="/" className="btn-primary mt-4 inline-block">Ir à loja</Link>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {orders.map((order) => (
                <OrderAccordion
                  key={order.id}
                  order={order}
                  openPaymentModal={openPaymentModal}
                  onCancelOrder={handleCancelOrder}
                  cancellingId={cancellingId}
                />
              ))}
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
    </div>
  )
}
