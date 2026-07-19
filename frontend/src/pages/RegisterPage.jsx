import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { Logo } from '../components/Logo'
import { GoogleAuthSection } from '../components/GoogleContinueButton'

export default function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const openLoginModal = useUiStore((s) => s.openLoginModal)
  const showToast = useUiStore((s) => s.showToast)
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const fileInputRef = useRef(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const finishAuth = useCallback((authResponse) => {
    login(authResponse)
    showToast({
      type: 'info',
      message: 'Conta pronta! Complete CPF, telefone e endereço em Minha conta quando quiser.',
      durationMs: 6000,
    })
    navigate('/')
  }, [login, navigate, showToast])

  const onSubmit = async (data) => {
    setError('')
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('email', data.email)
      formData.append('password', data.password)
      if (data.phone) formData.append('phone', data.phone)
      if (data.cpf) formData.append('cpf', data.cpf)
      if (photoFile) formData.append('photo', photoFile)

      const response = await api.post('/api/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      finishAuth(response.data)
    } catch (err) {
      const details = err.response?.data?.details
      setError(
        details
          ? Object.values(details).join(' ')
          : err.response?.data?.message || 'Erro ao criar conta.',
      )
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-brand-pink p-12 text-white lg:flex">
        <Logo size="md" className="drop-shadow-md" />
        <div>
          <h2 className="font-serif text-3xl font-bold">Faça parte da GIG</h2>
          <p className="mt-2 text-white/80">Crie sua conta e descubra vestidos exclusivos</p>
        </div>
        <div>
          <div className="mb-4 h-px w-16 bg-white/50" />
          <p className="text-sm text-white/70">GIG — Moda Feminina</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <h1 className="font-serif text-3xl font-bold">Criar conta</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Use o Google ou preencha seus dados. CPF e endereço podem ser completados depois em Minha conta.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="mt-8">
          <GoogleAuthSection
            onSuccess={finishAuth}
            onError={(msg) => setError(msg)}
            disabled={isSubmitting}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-brand-purple bg-brand-pink/20"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-brand-muted">
                  Sua foto
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-brand-muted">Clique para adicionar sua foto de perfil</p>
          </div>

          <div>
            <label className="label-field">Nome</label>
            <input {...register('name', { required: true })} placeholder="Digite o nome" className="input-field" />
          </div>
          <div>
            <label className="label-field">Email</label>
            <input
              {...register('email', { required: true })}
              type="email"
              placeholder="Digite o email"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Senha</label>
            <input
              {...register('password', { required: true, minLength: 8 })}
              type="password"
              placeholder="Mínimo 8 caracteres"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Telefone</label>
              <input {...register('phone')} placeholder="Opcional" className="input-field" />
            </div>
            <div>
              <label className="label-field">CPF</label>
              <input {...register('cpf')} placeholder="Opcional" className="input-field" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              Cadastrar
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm text-brand-muted">
          Já tem conta?{' '}
          <Link
            to="/"
            onClick={openLoginModal}
            className="font-semibold text-brand-purple hover:underline"
          >
            Voltar à loja e entrar
          </Link>
        </p>

        <Link to="/" className="mt-4 text-sm text-brand-muted hover:text-brand-purple">
          ← Voltar à loja
        </Link>
      </div>
    </div>
  )
}
