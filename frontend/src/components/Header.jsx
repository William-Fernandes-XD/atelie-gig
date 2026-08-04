import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { pageContent } from '../utils/page'

function SearchIcon() {
  return (
    <svg className="h-4 w-4 text-neon-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}

function UserAvatar({ user, size = 'md' }) {
  const baseUrl = import.meta.env.VITE_API_URL || ''
  const photoUrl = user.profilePhotoUrl ? `${baseUrl}${user.profilePhotoUrl}` : null
  const sizeClass = size === 'lg' ? 'h-10 w-10' : 'h-9 w-9'

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-neon-line/60`}
      />
    )
  }

  return (
    <span
      className={`${sizeClass} flex items-center justify-center rounded-full bg-white/20 font-serif text-sm font-semibold text-white ring-2 ring-neon-line/40`}
    >
      {user.name?.charAt(0)?.toUpperCase() || '?'}
    </span>
  )
}

function UserMenu({ user, logout, isAdmin }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const firstName = user.name?.split(' ')[0] || user.name

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/10"
      >
        <span className="hidden max-w-[180px] truncate text-sm text-white/95 lg:inline">
          Bem-vinda de volta, <span className="font-semibold">{firstName}</span>
        </span>
        <UserAvatar user={user} />
      </button>

      {open && (
        <ul className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-brand-pink/30 bg-white py-1 shadow-xl dark:border-neon-line/15 dark:bg-neon-surface dark:shadow-neon">
          <li className="border-b border-gray-100 px-4 py-2.5 dark:border-neon-line/10">
            <p className="truncate text-sm font-semibold text-neon-text">{user.name}</p>
            <p className="truncate text-xs text-neon-muted">{user.email}</p>
          </li>
          {isAdmin() && (
            <li>
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-neon-text hover:bg-brand-pink/30 hover:text-brand-purple dark:hover:bg-white/5 dark:hover:text-brand-pink"
              >
                Painel admin
              </Link>
            </li>
          )}
          <li>
            <Link
              to="/meus-pedidos"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-neon-text hover:bg-brand-pink/30 hover:text-brand-purple dark:hover:bg-white/5 dark:hover:text-brand-pink"
            >
              Meus pedidos
            </Link>
          </li>
          <li>
            <Link
              to="/minha-conta"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-neon-text hover:bg-brand-pink/30 hover:text-brand-purple dark:hover:bg-white/5 dark:hover:text-brand-pink"
            >
              Minha conta
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="block w-full px-4 py-2.5 text-left text-sm text-neon-text hover:bg-brand-pink/30 hover:text-brand-purple dark:hover:bg-white/5 dark:hover:text-brand-pink"
            >
              Sair
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

export function Header() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const totalItems = useCartStore((s) => s.getTotalQuantity())
  const { user, logout, isAdmin } = useAuthStore()
  const openLoginModal = useUiStore((s) => s.openLoginModal)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const dropdownRef = useRef(null)

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/api/categories?size=100&sort=name,asc')).data,
    staleTime: 1000 * 60 * 10,
  })

  const categories = pageContent(categoriesData)
  const visibleCategories = categories.filter((cat) => cat.slug !== 'sem-categoria')

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCategoriesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <header className="sticky top-0 z-40 shadow-sm subtle-glow">
      <div className="bg-brand-pink dark:bg-neon-surface dark:border-b dark:border-neon-line/10">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-6 sm:px-6 sm:py-3">
          <Link to="/" className="shrink-0 transition hover:opacity-90" aria-label="GIG — Moda Feminina">
            <Logo size="header" />
          </Link>

          <form onSubmit={handleSearch} className="mx-auto hidden min-w-0 flex-1 md:block md:max-w-xl">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque por algo..."
                className="w-full rounded-full border border-brand-charcoal/10 bg-white py-2.5 pl-11 pr-5 text-sm text-brand-charcoal shadow-sm placeholder:text-brand-muted/70 focus:border-brand-purple/40 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 dark:border-neon-line/15 dark:bg-neon-bg dark:text-neon-text dark:placeholder:text-neon-muted dark:focus:border-brand-pink/40 dark:focus:ring-brand-pink/20"
              />
            </div>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
            <ThemeToggle className="text-brand-charcoal hover:bg-black/5 dark:text-neon-text dark:hover:bg-white/10" />
            {user ? (
              <UserMenu user={user} logout={logout} isAdmin={isAdmin} />
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1 transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span className="hidden text-sm text-brand-charcoal dark:text-neon-text sm:inline">Entrar na sua conta</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/50 ring-2 ring-white/70 dark:bg-white/15 dark:ring-neon-line/30">
                  <svg className="h-5 w-5 text-brand-charcoal dark:text-neon-text" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </span>
              </button>
            )}

            <Link
              to="/carrinho"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-charcoal transition hover:bg-black/5 dark:text-neon-text dark:hover:bg-white/10"
              aria-label="Carrinho"
            >
              <BagIcon />
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-purple text-[10px] font-bold text-white ring-2 ring-brand-pink dark:bg-brand-pink dark:text-brand-charcoal dark:ring-neon-surface">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        <form onSubmit={handleSearch} className="border-t border-black/5 px-4 pb-3 dark:border-neon-line/10 md:hidden">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busque por algo..."
              className="w-full rounded-full border border-brand-charcoal/10 bg-white py-2.5 pl-11 pr-5 text-sm text-brand-charcoal shadow-sm placeholder:text-brand-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 dark:border-neon-line/15 dark:bg-neon-bg dark:text-neon-text dark:placeholder:text-neon-muted"
            />
          </div>
        </form>
      </div>

      <nav className="border-b border-brand-pink/30 bg-white/90 backdrop-blur dark:border-neon-line/10 dark:bg-neon-surface/95">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:px-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-pink/50 text-brand-purple dark:bg-white/10 dark:text-brand-pink'
                  : 'text-brand-charcoal hover:bg-brand-pink/20 hover:text-brand-purple dark:text-neon-muted dark:hover:bg-white/5 dark:hover:text-neon-text'
              }`
            }
          >
            Início
          </NavLink>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                categoriesOpen
                  ? 'bg-brand-pink/50 text-brand-purple dark:bg-white/10 dark:text-brand-pink'
                  : 'text-brand-charcoal hover:bg-brand-pink/20 hover:text-brand-purple dark:text-neon-muted dark:hover:bg-white/5 dark:hover:text-neon-text'
              }`}
            >
              Categorias
              <svg
                className={`h-3.5 w-3.5 transition ${categoriesOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {categoriesOpen && (
              <ul className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-2xl border border-brand-pink/40 bg-white py-2 shadow-lg dark:border-neon-line/15 dark:bg-neon-surface dark:shadow-neon">
                {visibleCategories.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-neon-muted">Nenhuma categoria</li>
                ) : (
                  visibleCategories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        to={`/categoria/${cat.id}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="block px-4 py-2.5 text-sm text-neon-text transition hover:bg-brand-pink/30 hover:text-brand-purple dark:hover:bg-white/5 dark:hover:text-brand-pink"
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          <div className="ml-auto hidden items-center gap-2 sm:flex">
            {visibleCategories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                to={`/categoria/${cat.id}`}
                className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-neon-muted transition hover:bg-brand-pink/20 hover:text-brand-purple dark:hover:bg-white/5 dark:hover:text-neon-text"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
