import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function clearTokenStorage() {
  localStorage.removeItem('atelie_token')
}

function decodeJwtPayload(token) {
  const part = token.split('.')[1]
  if (!part) return null
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(atob(padded))
}

function isJwtExpired(token) {
  if (!token) return true
  try {
    const payload = decodeJwtPayload(token)
    if (!payload?.exp) return false
    // margem de 30s
    return payload.exp * 1000 <= Date.now() + 30_000
  } catch {
    return true
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (authResponse) => {
        localStorage.setItem('atelie_token', authResponse.token)
        set({
          token: authResponse.token,
          user: {
            id: authResponse.userId,
            name: authResponse.name,
            email: authResponse.email,
            role: authResponse.role,
            profilePhotoUrl: authResponse.profilePhotoUrl,
          },
        })
      },

      logout: () => {
        clearTokenStorage()
        set({ user: null, token: null })
      },

      /** Remove sessão se o JWT estiver inválido/expirado. */
      syncSession: () => {
        const token = get().token || localStorage.getItem('atelie_token')
        if (!token || isJwtExpired(token)) {
          clearTokenStorage()
          set({ user: null, token: null })
          return false
        }
        if (!get().token) {
          set({ token })
        }
        return true
      },

      updateUser: (partial) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        }))
      },

      isAdmin: () => {
        const role = useAuthStore.getState().user?.role
        return ['ADMIN', 'GERENTE', 'ESTOQUISTA'].includes(role)
      },
    }),
    { name: 'atelie-auth' },
  ),
)
