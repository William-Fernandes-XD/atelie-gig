import { NavLink, Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { LoginModal } from '../components/LoginModal'
import { PaymentModal } from '../components/PaymentModal'
import { ToastHost } from '../components/ToastHost'
import { ThemeToggle } from '../components/ThemeToggle'
import { Logo } from '../components/Logo'

const SIDEBAR_KEY = 'atelie-gg-admin-sidebar'

export function StoreLayout() {
  const [searchParams, setSearchParams] = useSearchParams()
  const openLoginModal = useUiStore((s) => s.openLoginModal)

  useEffect(() => {
    if (searchParams.get('login') === '1') {
      openLoginModal()
      searchParams.delete('login')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, openLoginModal])

  return (
    <div className="flex min-h-screen flex-col bg-neon-bg">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <LoginModal />
      <PaymentModal />
      <ToastHost />
    </div>
  )
}

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/usuarios', label: 'Usuários' },
  { type: 'group', label: 'Conteúdo' },
  { to: '/admin/conteudo/hero', label: 'Hero Section' },
]

function AdminNavLink({ to, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `relative rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-brand-pink text-brand-charcoal shadow-neon dark:bg-white/10 dark:text-brand-pink dark:shadow-[0_0_18px_rgba(255,255,255,0.08)]'
            : 'text-neon-text hover:bg-brand-pink/25 dark:text-neon-muted dark:hover:bg-white/5 dark:hover:text-neon-text'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

function MenuIcon({ open }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
      )}
    </svg>
  )
}

function readSidebarOpen() {
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY)
    if (stored === '0') return false
    if (stored === '1') return true
  } catch {
    // ignore
  }
  return true
}

export function AdminLayout() {
  const isAdmin = useAuthStore((s) => {
    const role = s.user?.role
    return ['ADMIN', 'GERENTE', 'ESTOQUISTA'].includes(role)
  })
  const userName = useAuthStore((s) => s.user?.name)
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarOpen)

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0')
      } catch {
        // ignore
      }
      return next
    })
  }

  if (!isAdmin) {
    return <Navigate to="/?login=1" replace />
  }

  return (
    <div className="min-h-screen bg-neon-bg">
      {/* Overlay mobile quando menu aberto */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-label="Fechar menu"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar fixa */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-brand-pink/30 bg-neon-surface/95 p-5 shadow-neon backdrop-blur-md transition-transform duration-300 ease-out dark:border-neon-line/10 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(242,196,208,0.35),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_70%)]" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Logo size="sm" />
            <p className="mt-3 font-display text-lg font-bold tracking-tight text-neon-text neon-glow-text">
              Painel GIG
            </p>
            <p className="mt-0.5 text-xs text-neon-muted">Gestão da loja</p>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neon-line/15 text-neon-text transition hover:border-brand-pink/50 hover:bg-brand-pink/20 dark:hover:bg-white/5"
            aria-label="Fechar menu"
            title="Fechar menu"
          >
            <MenuIcon open />
          </button>
        </div>

        <nav className="relative mt-8 flex flex-1 flex-col gap-1 overflow-y-auto">
          {ADMIN_NAV.map((item) =>
            item.type === 'group' ? (
              <p
                key={`group-${item.label}`}
                className="mt-4 px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neon-muted first:mt-0"
              >
                {item.label}
              </p>
            ) : (
              <AdminNavLink
                key={item.to}
                {...item}
                onClick={() => {
                  if (window.matchMedia('(max-width: 1023px)').matches && sidebarOpen) {
                    toggleSidebar()
                  }
                }}
              />
            ),
          )}
        </nav>

        <div className="relative mt-4 space-y-3 border-t border-neon-line/10 pt-4">
          {userName && (
            <p className="truncate text-xs text-neon-muted">
              Olá, <span className="font-medium text-neon-text">{userName}</span>
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <NavLink
              to="/"
              className="rounded-xl px-2 py-2 text-sm text-neon-muted transition hover:bg-brand-pink/20 hover:text-neon-text dark:hover:bg-white/5"
            >
              ← Loja
            </NavLink>
            <ThemeToggle className="border border-neon-line/15 text-neon-text hover:border-brand-pink/50 hover:bg-brand-pink/20 dark:hover:bg-white/5" />
          </div>
        </div>
      </aside>

      {/* Conteúdo: acompanha a sidebar no desktop */}
      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ease-out ${
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-brand-pink/30 bg-neon-surface/90 px-4 py-3 backdrop-blur-md dark:border-neon-line/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neon-line/15 text-neon-text transition hover:border-brand-pink/50 hover:bg-brand-pink/20 dark:hover:bg-white/5"
              aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <MenuIcon open={sidebarOpen} />
            </button>
            <div>
              <p className="font-display text-sm font-bold text-neon-text">Painel GIG</p>
              <p className="text-[11px] text-neon-muted">Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NavLink to="/" className="hidden text-xs text-neon-muted hover:text-neon-text sm:inline">
              Loja
            </NavLink>
            <ThemeToggle className="border border-neon-line/15 text-neon-text hover:border-brand-pink/40 hover:bg-brand-pink/15 dark:hover:bg-white/5" />
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden p-4 text-neon-text sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>

      <ToastHost />
    </div>
  )
}
