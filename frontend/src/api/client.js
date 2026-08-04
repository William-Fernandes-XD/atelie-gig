import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  useAuthStore.getState().syncSession()
  const token = useAuthStore.getState().token || localStorage.getItem('atelie_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }

  // Ngrok free: sem este header o POST de login volta HTML da página de aviso (e o login “quebra”).
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  if (host.includes('ngrok')) {
    config.headers['ngrok-skip-browser-warning'] = 'true'
  }

  // FormData precisa do boundary automático do browser — não forçar Content-Type.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Content-Type', undefined)
    } else if (config.headers) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 = sessão inválida/expirada. 403 = sem permissão (não desloga automaticamente).
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

export default api
