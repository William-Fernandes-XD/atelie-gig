import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { Logo } from './Logo'
import { GoogleAuthSection } from './GoogleContinueButton'
import { BusyButton } from './BusyButton'
import { useBusyAction } from '../hooks/useBusyAction'

function formatCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m <= 0) return `${r}s`
  return `${m}:${String(r).padStart(2, '0')}`
}

export function LoginModal() {
  const navigate = useNavigate()
  const { loginModalOpen, closeLoginModal, showToast } = useUiStore()
  const login = useAuthStore((s) => s.login)
  const { register, handleSubmit, reset } = useForm()
  const [error, setError] = useState(null)
  const [lockSeconds, setLockSeconds] = useState(0)
  const { busy, run } = useBusyAction()

  useEffect(() => {
    if (!loginModalOpen) {
      reset()
      setError(null)
      setLockSeconds(0)
    }
  }, [loginModalOpen, reset])

  // Contador ao vivo (estilo Oracle APEX)
  useEffect(() => {
    if (lockSeconds <= 0) return undefined
    const timer = setTimeout(() => {
      setLockSeconds((prev) => {
        const next = prev - 1
        if (next <= 0) setError(null)
        return Math.max(0, next)
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [lockSeconds])

  const finishAuth = useCallback((authResponse) => {
    login(authResponse)
    closeLoginModal()
    const name = (authResponse.name || '').trim() || 'cliente'
    showToast({
      type: 'info',
      message: `Bem vindo de volta, ${name}!`,
    })
    if (['ADMIN', 'GERENTE', 'ESTOQUISTA'].includes(authResponse.role)) {
      navigate('/admin')
    }
  }, [login, closeLoginModal, showToast, navigate])

  if (!loginModalOpen) return null

  const locked = lockSeconds > 0
  const formLocked = locked || busy

  const onSubmit = handleSubmit((data) =>
    run(async () => {
      if (locked) return
      setError(null)
      try {
        const response = await api.post('/api/auth/login', {
          email: data.email,
          password: data.password,
        })
        finishAuth(response.data)
      } catch (err) {
        const payload = err.response?.data
        const retry = Number(
          payload?.details?.retryAfterSeconds
            ?? payload?.retryAfterSeconds
            ?? 0,
        )
        if (retry > 0) {
          setLockSeconds(retry)
          setError('Email ou senha inválidos.')
        } else {
          setError(payload?.message || 'Email ou senha inválidos.')
        }
      }
    }),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={closeLoginModal}
        aria-label="Fechar"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-brand-pink/40 bg-neon-surface shadow-neon dark:border-neon-line/15"
      >
        <div className="relative overflow-hidden bg-brand-pink px-8 py-7 text-center dark:bg-gradient-to-br dark:from-neon-surface dark:via-neon-bg dark:to-neon-surface">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_55%)]" />
          <Logo size="sm" className="relative mx-auto" />
          <h2 className="relative mt-4 font-display text-2xl font-bold tracking-tight text-brand-charcoal dark:text-neon-text">
            Bom te ver novamente
          </h2>
          <p className="relative mt-1 text-sm text-brand-charcoal/70 dark:text-neon-muted">Realize o login na GIG</p>
        </div>

        <div className="px-8 py-6">
          <AnimatePresence mode="wait">
            {(error || locked) && (
              <motion.div
                key={locked ? 'lock' : 'err'}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 rounded-lg border border-red-200/80 bg-red-50/90 px-3.5 py-2.5 text-sm leading-relaxed text-red-600 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-300"
                role="alert"
                aria-live="polite"
              >
                {locked ? (
                  <p>
                    {error || 'Email ou senha inválidos.'}
                    {' '}
                    <span className="text-red-500/80 dark:text-red-300/80">
                      Tente de novo em{' '}
                      <span className="tabular-nums font-medium text-brand-purple dark:text-brand-pink">
                        {formatCountdown(lockSeconds)}
                      </span>
                      .
                    </span>
                  </p>
                ) : (
                  error
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <GoogleAuthSection
            onSuccess={finishAuth}
            onError={(msg) => setError(msg)}
            disabled={formLocked}
          />

          <form onSubmit={onSubmit} className="space-y-4" aria-busy={busy}>
            <fieldset disabled={formLocked} className="min-w-0 space-y-4 border-0 p-0">
              <div>
                <label className="label-field">Email</label>
                <input
                  {...register('email', { required: true })}
                  type="email"
                  placeholder="Digite o email"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div>
                <label className="label-field">Senha</label>
                <input
                  {...register('password', { required: true })}
                  type="password"
                  placeholder="Digite a senha"
                  className="input-field"
                />
                <Link
                  to="/esqueci-senha"
                  onClick={closeLoginModal}
                  className="mt-2 inline-block text-sm text-neon-cyan hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </fieldset>
            <BusyButton
              type="submit"
              busy={busy}
              disabled={locked}
              busyLabel="Entrando..."
              className="btn-primary w-full"
            >
              {locked ? `Aguarde ${formatCountdown(lockSeconds)}` : 'Entrar'}
            </BusyButton>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Não tem conta?{' '}
            <Link
              to="/cadastro"
              onClick={closeLoginModal}
              className="font-semibold text-neon-pink hover:underline"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-neon-line/20 bg-black/30 text-white hover:border-neon-pink/60 hover:text-neon-pink"
          aria-label="Fechar modal"
        >
          ✕
        </button>
      </motion.div>
    </div>
  )
}
