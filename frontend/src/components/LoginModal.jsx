import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { Logo } from './Logo'
import { GoogleAuthSection } from './GoogleContinueButton'

export function LoginModal() {
  const navigate = useNavigate()
  const { loginModalOpen, closeLoginModal, showToast } = useUiStore()
  const login = useAuthStore((s) => s.login)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!loginModalOpen) {
      reset()
      setError(null)
    }
  }, [loginModalOpen, reset])

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

  const onSubmit = async (data) => {
    setError(null)
    try {
      const response = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      })
      finishAuth(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Email ou senha inválidos.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeLoginModal}
        aria-label="Fechar"
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-brand-pink px-8 py-6 text-center text-white">
          <Logo size="sm" className="mx-auto drop-shadow-md" />
          <h2 className="mt-4 font-serif text-2xl font-bold">Bom te ver novamente</h2>
          <p className="mt-1 text-sm text-white/80">Realize o login na GIG</p>
        </div>

        <div className="px-8 py-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <GoogleAuthSection
            onSuccess={finishAuth}
            onError={(msg) => setError(msg)}
            disabled={isSubmitting}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                className="mt-2 inline-block text-sm text-brand-purple hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              Entrar
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            Não tem conta?{' '}
            <Link
              to="/cadastro"
              onClick={closeLoginModal}
              className="font-semibold text-brand-purple hover:underline"
            >
              Criar conta
            </Link>
          </p>
        </div>

        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          aria-label="Fechar modal"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
