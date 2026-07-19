import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import { Logo } from '../components/Logo'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()

  const onRequestCode = async (data) => {
    setError('')
    setMessage('')
    try {
      const response = await api.post('/api/auth/forgot-password', { email: data.email })
      setEmail(data.email)
      setMessage(response.data.message)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao solicitar código.')
    }
  }

  const onResetPassword = async (data) => {
    setError('')
    setMessage('')
    try {
      const response = await api.post('/api/auth/reset-password', {
        email,
        code: data.code,
        newPassword: data.newPassword,
      })
      setMessage(response.data.message)
      setTimeout(() => navigate('/?login=1'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha.')
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-brand-pink p-12 text-white lg:flex">
        <Logo size="md" className="drop-shadow-md" />
        <div>
          <h2 className="font-serif text-3xl font-bold">Recuperar acesso</h2>
          <p className="mt-2 text-white/80">Enviaremos um código para seu email</p>
        </div>
        <div>
          <div className="mb-4 h-px w-16 bg-white/50" />
          <p className="text-sm text-white/70">GIG — Moda Feminina</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <h1 className="font-serif text-3xl font-bold">
          {step === 1 ? 'Esqueceu a senha?' : 'Redefinir senha'}
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          {step === 1
            ? 'Informe seu email e enviaremos um código de verificação.'
            : `Digite o código enviado para ${email} e sua nova senha.`}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}
        {message && (
          <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit(onRequestCode)} className="mt-8 space-y-5">
            <div>
              <label className="label-field">Email:</label>
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="Digite o email"
                className="input-field"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                Enviar código
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onResetPassword)} className="mt-8 space-y-5">
            <div>
              <label className="label-field">Código de verificação:</label>
              <input
                {...register('code', { required: true, pattern: /^\d{6}$/ })}
                placeholder="000000"
                maxLength={6}
                className="input-field tracking-[0.5em]"
              />
            </div>
            <div>
              <label className="label-field">Nova senha:</label>
              <input
                {...register('newPassword', { required: true, minLength: 8 })}
                type="password"
                placeholder="Digite a nova senha"
                className="input-field"
              />
            </div>
            <div className="flex justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-outline">
                Voltar
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                Redefinir senha
              </button>
            </div>
          </form>
        )}

        <Link to="/?login=1" className="mt-6 text-sm text-brand-purple hover:underline">
          ← Voltar ao login
        </Link>
      </div>
    </div>
  )
}
