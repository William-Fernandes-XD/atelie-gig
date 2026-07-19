import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../../api/client'
import { PAGE_SIZE } from '../../constants/pagination'

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function truncateLabel(value, max = 12) {
  const text = String(value || '')
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function currencyTooltip(value) {
  return [formatCurrency(value), 'Faturamento']
}

function quantityTooltip(value) {
  return [`${value} un.`, 'Quantidade vendida']
}

function spentTooltip(value) {
  return [formatCurrency(value), 'Total gasto']
}

function getDefaultRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  }
}

function ChartCard({ title, children, empty, tall = false }) {
  return (
    <section className="rounded-2xl border border-brand-pink/40 bg-white p-6 shadow-sm ring-1 ring-brand-pink/20">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <div className={`mt-4 ${tall ? 'h-96' : 'h-80'}`}>
        {empty ? (
          <p className="flex h-full items-center justify-center text-sm text-brand-muted">Sem dados no período</p>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

function AxisTick({ x, y, payload }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill="#6b7280"
        fontSize={10}
      >
        {truncateLabel(payload.value, 14)}
      </text>
    </g>
  )
}

export default function AdminDashboard() {
  const defaults = useMemo(() => getDefaultRange(), [])
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [endDate, setEndDate] = useState(defaults.endDate)
  const [appliedRange, setAppliedRange] = useState(defaults)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard', appliedRange.startDate, appliedRange.endDate],
    queryFn: async () => {
      const response = await api.get('/api/admin/dashboard', {
        params: {
          startDate: appliedRange.startDate,
          endDate: appliedRange.endDate,
        },
      })
      return response.data
    },
  })

  const applyFilters = (e) => {
    e.preventDefault()
    setAppliedRange({ startDate, endDate })
  }

  if (isLoading && !data) {
    return <p>Carregando dashboard...</p>
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
        Erro ao carregar dashboard: {error?.response?.data?.message || error?.message || 'tente novamente.'}
      </div>
    )
  }

  const topBuyers = (data?.topBuyers || []).map((b) => ({
    ...b,
    totalSpent: Number(b.totalSpent),
  }))

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-serif text-3xl font-bold">Dashboard</h1>

        <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-brand-muted">Data início</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="admin-input"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-brand-muted">Data fim</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="admin-input"
              required
            />
          </label>
          <button type="submit" className="btn-primary px-5 py-2.5 text-sm">
            Filtrar
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Faturamento (período)" value={formatCurrency(data?.revenue)} />
        <StatCard title="Pedidos (período)" value={data?.orderCount || 0} />
        <StatCard title="Sem estoque" value={data?.outOfStockProducts?.length || 0} />
        <StatCard title="Top produtos" value={data?.topSellingProducts?.length || 0} />
      </div>

      <div className="mt-10">
        <ChartCard title="Faturamento — últimos 12 meses" empty={!data?.monthlyRevenue?.length} tall>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.monthlyRevenue || []} margin={{ top: 24, right: 8, left: 8, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                interval={0}
                tick={<AxisTick />}
                height={40}
                label={{ value: 'Mês', position: 'insideBottom', offset: -18, fill: '#9ca3af', fontSize: 11 }}
              />
              <YAxis tickFormatter={(v) => `R$ ${v}`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={currencyTooltip}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Bar dataKey="revenue" name="Faturamento" fill="#c084fc" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="revenue"
                  position="top"
                  formatter={(v) => (Number(v) > 0 ? formatCurrency(v) : '')}
                  style={{ fontSize: 10, fill: '#6b7280' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <ChartCard title="Top 10 produtos mais vendidos" empty={!data?.topSellingProducts?.length} tall>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.topSellingProducts || []} margin={{ top: 24, right: 8, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="productTitle"
                interval={0}
                tick={<AxisTick />}
                height={56}
                label={{ value: 'Produto', position: 'insideBottom', offset: -18, fill: '#9ca3af', fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={quantityTooltip}
                labelFormatter={(label) => `Produto: ${label}`}
              />
              <Bar dataKey="totalQuantity" name="Quantidade vendida" fill="#f9a8d4" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="totalQuantity" position="top" style={{ fontSize: 10, fill: '#6b7280' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 categorias mais vendidas" empty={!data?.topCategories?.length} tall>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.topCategories || []} margin={{ top: 24, right: 8, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="categoryName"
                interval={0}
                tick={<AxisTick />}
                height={56}
                label={{ value: 'Categoria', position: 'insideBottom', offset: -18, fill: '#9ca3af', fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={quantityTooltip}
                labelFormatter={(label) => `Categoria: ${label}`}
              />
              <Bar dataKey="totalQuantity" name="Quantidade vendida" fill="#a78bfa" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="totalQuantity" position="top" style={{ fontSize: 10, fill: '#6b7280' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-8">
        <ChartCard title="Top 10 clientes que mais compraram" empty={!topBuyers.length} tall>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topBuyers} margin={{ top: 24, right: 8, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="customerName"
                interval={0}
                tick={<AxisTick />}
                height={56}
                label={{ value: 'Cliente', position: 'insideBottom', offset: -18, fill: '#9ca3af', fontSize: 11 }}
              />
              <YAxis tickFormatter={(v) => `R$ ${v}`} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={spentTooltip}
                labelFormatter={(label) => `Cliente: ${label}`}
              />
              <Bar dataKey="totalSpent" name="Total gasto" fill="#fb7185" radius={[4, 4, 0, 0]}>
                <LabelList
                  dataKey="totalSpent"
                  position="top"
                  formatter={(v) => formatCurrency(v)}
                  style={{ fontSize: 10, fill: '#6b7280' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-brand-pink/40 bg-white p-6 shadow-sm ring-1 ring-brand-pink/20">
          <h2 className="font-serif text-xl font-semibold">Produtos sem estoque</h2>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {(data?.outOfStockProducts || []).slice(0, PAGE_SIZE).map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-brand-pink/20 bg-brand-pink/10 px-3 py-2 text-sm"
              >
                {p.productTitle} — {p.colorName} / {p.sizeName}
              </li>
            ))}
            {!data?.outOfStockProducts?.length && (
              <li className="text-brand-muted">Nenhum produto sem estoque</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-brand-pink/40 bg-white p-6 shadow-sm ring-1 ring-brand-pink/20">
          <h2 className="font-serif text-xl font-semibold">Vendas recentes (período)</h2>
          <div className="admin-table-wrap mt-4 max-h-72">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentSales || []).slice(0, PAGE_SIZE).map((sale, i) => (
                  <tr key={i}>
                    <td className="font-medium">{sale.orderNumber}</td>
                    <td>{sale.customerName}</td>
                    <td className="font-semibold text-brand-purple">{formatCurrency(sale.total)}</td>
                  </tr>
                ))}
                {!data?.recentSales?.length && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-brand-muted">
                      Nenhuma venda no período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-brand-pink/40 bg-gradient-to-br from-brand-pink/25 via-white to-white p-6 shadow-sm ring-1 ring-brand-pink/20">
      <p className="text-sm text-brand-muted">{title}</p>
      <p className="mt-2 text-2xl font-bold text-brand-charcoal">{value}</p>
    </div>
  )
}
