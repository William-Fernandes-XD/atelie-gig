import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import { createAppQueryClient } from './lib/queryClient'
import './index.css'

const queryClient = createAppQueryClient()

function AuthBootstrap({ children }) {
  useEffect(() => {
    useAuthStore.getState().syncSession()
    // Garante classe dark/light aplicada após hidratação
    useThemeStore.getState().setTheme(useThemeStore.getState().theme)
  }, [])
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <App />
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
