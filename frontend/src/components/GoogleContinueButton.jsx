import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar Google')))
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar Google'))
    document.head.appendChild(script)
  })
}

/**
 * Botão "Continuar com Google" (Google Identity Services).
 * onSuccess recebe AuthResponse da API.
 */
export function GoogleContinueButton({ onSuccess, onError, disabled = false }) {
  const buttonRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const callbackRef = useRef({ onSuccess, onError })

  useEffect(() => {
    callbackRef.current = { onSuccess, onError }
  }, [onSuccess, onError])

  const { data: config } = useQuery({
    queryKey: ['google-auth-config'],
    queryFn: async () => (await api.get('/api/auth/google/config')).data,
    staleTime: 1000 * 60 * 10,
  })

  useEffect(() => {
    if (!config?.enabled || !config.clientId || !buttonRef.current) return undefined

    let cancelled = false

    const setup = async () => {
      try {
        await loadGoogleScript()
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return

        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: async (response) => {
            if (!response?.credential) {
              callbackRef.current.onError?.('Não foi possível obter credencial do Google.')
              return
            }
            setLoading(true)
            try {
              const { data } = await api.post('/api/auth/google', {
                idToken: response.credential,
              })
              callbackRef.current.onSuccess?.(data)
            } catch (err) {
              callbackRef.current.onError?.(
                err.response?.data?.message || 'Erro ao entrar com Google.',
              )
            } finally {
              setLoading(false)
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        buttonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: Math.min(buttonRef.current.offsetWidth || 320, 400),
        })
        if (!cancelled) setReady(true)
      } catch (err) {
        callbackRef.current.onError?.(err.message || 'Google indisponível.')
      }
    }

    setup()
    return () => {
      cancelled = true
    }
  }, [config])

  if (!config?.enabled) {
    return null
  }

  return (
    <div className="w-full">
      <div
        ref={buttonRef}
        className={`flex min-h-[44px] w-full justify-center ${disabled || loading ? 'pointer-events-none opacity-60' : ''}`}
      />
      {!ready && (
        <p className="mt-2 text-center text-xs text-brand-muted">Carregando Google...</p>
      )}
      {loading && (
        <p className="mt-2 text-center text-xs text-brand-muted">Autenticando...</p>
      )}
    </div>
  )
}

export function AuthDivider({ label = 'ou' }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs uppercase tracking-wide text-brand-muted">{label}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  )
}

/** Google + divisor — some se GOOGLE_CLIENT_ID não estiver configurado. */
export function GoogleAuthSection({ onSuccess, onError, disabled = false }) {
  const { data: config, isLoading } = useQuery({
    queryKey: ['google-auth-config'],
    queryFn: async () => (await api.get('/api/auth/google/config')).data,
    staleTime: 1000 * 60 * 10,
  })

  if (isLoading || !config?.enabled) return null

  return (
    <>
      <GoogleContinueButton onSuccess={onSuccess} onError={onError} disabled={disabled} />
      <AuthDivider />
    </>
  )
}

