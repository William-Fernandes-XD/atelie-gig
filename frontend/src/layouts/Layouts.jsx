import { useEffect } from 'react'
import { NavLink, Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { LoginModal } from '../components/LoginModal'
import { PaymentModal } from '../components/PaymentModal'
import { ToastHost } from '../components/ToastHost'

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
    <div className="flex min-h-screen flex-col">
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

export function AdminLayout() {
  const isAdmin = useAuthStore((s) => {
    const role = s.user?.role
    return ['ADMIN', 'GERENTE', 'ESTOQUISTA'].includes(role)
  })

  if (!isAdmin) {
    return <Navigate to="/?login=1" replace />
  }

  return (
    <div className="flex min-h-screen bg-brand-pink/10">
      <aside className="hidden w-64 flex-shrink-0 border-r border-brand-pink/30 bg-white p-6 md:block">
        <h2 className="font-serif text-xl font-bold text-brand-charcoal">Painel GIG</h2>
        <nav className="mt-8 flex flex-col gap-1">
          {[
            { to: '/admin', label: 'Dashboard', end: true },
            { to: '/admin/categorias', label: 'Categorias' },
            { to: '/admin/produtos', label: 'Produtos' },
            { to: '/admin/pedidos', label: 'Pedidos' },
            { to: '/admin/usuarios', label: 'Usuários' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-pink text-brand-charcoal'
                    : 'text-brand-charcoal hover:bg-brand-pink/30'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/"
            className="mt-4 rounded-lg px-3 py-2 text-sm text-brand-muted hover:bg-brand-pink/30"
          >
            ← Voltar à loja
          </NavLink>
        </nav>
      </aside>
      <div className="flex-1 overflow-x-hidden p-4 sm:p-6">
        <Outlet />
      </div>
      <ToastHost />
    </div>
  )
}
