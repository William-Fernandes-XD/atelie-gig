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
import { useThemeStore } from '../../store/themeStore'

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

function useChartTheme() {
  const theme = useThemeStore((s) => s.theme)
  const dark = theme === 'dark'
  return {
    dark,
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(242,196,208,0.55)',
    tick: dark ? '#a0a0a8' : '#6b6b6b',
    label: dark ? '#8a8a94' : '#9ca3af',
    tooltipBg: dark ? '#1c1c20' : '#ffffff',
    tooltipBorder: dark ? 'rgba(255,255,255,0.12)' : 'rgba(242,196,208,0.6)',
    barPrimary: dark ? '#f2c4d0' : '#9B8FD9',
    barSecondary: dark ? '#c8c8d0' : '#f2c4d0',
    barTertiary: dark ? '#e8a8b8' : '#a78bfa',
    barAccent: dark ? '#ffffff' : '#fb7185',
  }
}

function ChartCard({ title, children, empty, tall = false }) {
  return (
    <section className="admin-card">
      <h2 className="font-display text-xl font-semibold text-neon-text">{title}</h2>
      <div className={`mt-4 ${tall ? 'h-96' : 'h-80'}`}>
        {empty ? (
          <p className="flex h-full items-center justify-center text-sm text-neon-muted">
            Sem dados no período
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

function AxisTick({ x, y, payload, fill }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill={fill} fontSize={10}>
        {truncateLabel(payload.value, 14)}
      </text>
    </g>
  )
}

function StatCard({ title, value, accent }) {
  return (
    <div className="admin-card relative overflow-hidden !p-5">
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-40 blur-2xl ${accent}`}
      />
      <p className="relative text-sm text-neon-muted">{title}</p>
      <p className="relative mt-2 font-display text-2xl font-bold tracking-tight text-neon-text">
        {value}
      </p>
    </div>
  )
}

export default function AdminDashboard() {
  const defaults = useMemo(() => getDefaultRange(), [])
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [endDate, setEndDate] = useState(defaults.endDate)
  const [appliedRange, setAppliedRange] = useState(defaults)
  const chart = useChartTheme()

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
    return <p className="text-neon-muted">Carregando dashboard...</p>
  }

  if (isError) {
    return (
      <div className="admin-alert-err">
        Erro ao carregar dashboard:{' '}
        {error?.response?.data?.message || error?.message || 'tente novamente.'}
      </div>
    )
  }

  const topBuyers = (data?.topBuyers || []).map((b) => ({
    ...b,
    totalSpent: Number(b.totalSpent),
  }))

  const tooltipStyle = {
    backgroundColor: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 12,
    color: chart.dark ? '#ececf0' : '#2b2b2b',
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-sub">Visão geral de vendas, estoque e clientes</p>
        </div>

        <form
          onSubmit={applyFilters}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-brand-pink/30 bg-neon-surface/80 p-3 dark:border-neon-line/10"
        >
          <label className="text-sm">
            <span className="mb-1 block text-neon-muted">Data início</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="admin-input"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-neon-muted">Data fim</span>
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Faturamento (período)"
          value={formatCurrency(data?.revenue)}
          accent="bg-brand-purple"
        />
        <StatCard
          title="Pedidos (período)"
          value={data?.orderCount || 0}
          accent="bg-brand-pink"
        />
        <StatCard
          title="Sem estoque"
          value={data?.outOfStockProducts?.length || 0}
          accent="bg-red-400"
        />
        <StatCard
          title="Top produtos"
          value={data?.topSellingProducts?.length || 0}
          accent="bg-brand-purple"
        />
      </div>

      <div className="mt-8">
        <ChartCard title="Faturamento — últimos 12 meses" empty={!data?.monthlyRevenue?.length} tall>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.monthlyRevenue || []} margin={{ top: 24, right: 8, left: 8, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="month"
                interval={0}
                tick={<AxisTick fill={chart.tick} />}
                height={40}
                label={{ value: 'Mês', position: 'insideBottom', offset: -18, fill: chart.label, fontSize: 11 }}
              />
              <YAxis tickFormatter={(v) => `R$ ${v}`} tick={{ fontSize: 11, fill: chart.tick }} />
              <Tooltip formatter={currencyTooltip} labelFormatter={(label) => `Mês: ${label}`} contentStyle={tooltipStyle} />
              <Bar dataKey="revenue" name="Faturamento" fill={chart.barPrimary} radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="revenue"
                  position="top"
                  formatter={(v) => (Number(v) > 0 ? formatCurrency(v) : '')}
                  style={{ fontSize: 10, fill: chart.tick }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Top 10 produtos mais vendidos" empty={!data?.topSellingProducts?.length} tall>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.topSellingProducts || []} margin={{ top: 24, right: 8, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="productTitle"
                interval={0}
                tick={<AxisTick fill={chart.tick} />}
                height={56}
                label={{ value: 'Produto', position: 'insideBottom', offset: -18, fill: chart.label, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11, fill: chart.tick }} allowDecimals={false} />
              <Tooltip formatter={quantityTooltip} labelFormatter={(label) => `Produto: ${label}`} contentStyle={tooltipStyle} />
              <Bar dataKey="totalQuantity" name="Quantidade vendida" fill={chart.barSecondary} radius={[6, 6, 0, 0]}>
                <LabelList dataKey="totalQuantity" position="top" style={{ fontSize: 10, fill: chart.tick }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 categorias mais vendidas" empty={!data?.topCategories?.length} tall>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.topCategories || []} margin={{ top: 24, right: 8, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="categoryName"
                interval={0}
                tick={<AxisTick fill={chart.tick} />}
                height={56}
                label={{ value: 'Categoria', position: 'insideBottom', offset: -18, fill: chart.label, fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11, fill: chart.tick }} allowDecimals={false} />
              <Tooltip formatter={quantityTooltip} labelFormatter={(label) => `Categoria: ${label}`} contentStyle={tooltipStyle} />
              <Bar dataKey="totalQuantity" name="Quantidade vendida" fill={chart.barTertiary} radius={[6, 6, 0, 0]}>
                <LabelList dataKey="totalQuantity" position="top" style={{ fontSize: 10, fill: chart.tick }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-8">
        <ChartCard title="Top 10 clientes que mais compraram" empty={!topBuyers.length} tall>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topBuyers} margin={{ top: 24, right: 8, left: 8, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="customerName"
                interval={0}
                tick={<AxisTick fill={chart.tick} />}
                height={56}
                label={{ value: 'Cliente', position: 'insideBottom', offset: -18, fill: chart.label, fontSize: 11 }}
              />
              <YAxis tickFormatter={(v) => `R$ ${v}`} tick={{ fontSize: 11, fill: chart.tick }} />
              <Tooltip formatter={spentTooltip} labelFormatter={(label) => `Cliente: ${label}`} contentStyle={tooltipStyle} />
              <Bar dataKey="totalSpent" name="Total gasto" fill={chart.barAccent} radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="totalSpent"
                  position="top"
                  formatter={(v) => formatCurrency(v)}
                  style={{ fontSize: 10, fill: chart.tick }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="admin-card">
          <h2 className="font-display text-xl font-semibold text-neon-text">Produtos sem estoque</h2>
          <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {(data?.outOfStockProducts || []).slice(0, PAGE_SIZE).map((p, i) => (
              <li
                key={i}
                className="rounded-xl border border-brand-pink/25 bg-brand-pink/10 px-3 py-2.5 text-sm dark:border-neon-line/10 dark:bg-white/[0.04]"
              >
                {p.productTitle} — {p.colorName} / {p.sizeName}
              </li>
            ))}
            {!data?.outOfStockProducts?.length && (
              <li className="text-neon-muted">Nenhum produto sem estoque</li>
            )}
          </ul>
        </section>

        <section className="admin-card">
          <h2 className="font-display text-xl font-semibold text-neon-text">Vendas recentes (período)</h2>
          <div className="admin-table-wrap mt-4 max-h-72 !shadow-none">
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
                    <td className="font-semibold text-brand-purple dark:text-brand-pink">
                      {formatCurrency(sale.total)}
                    </td>
                  </tr>
                ))}
                {!data?.recentSales?.length && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-neon-muted">
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
