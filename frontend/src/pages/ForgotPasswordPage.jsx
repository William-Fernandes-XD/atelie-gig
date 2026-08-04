import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../api/client'
import { Logo } from '../components/Logo'
import { BusyButton } from '../components/BusyButton'
import { useBusyAction } from '../hooks/useBusyAction'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')
  const { register, handleSubmit, reset, setValue } = useForm()
  const { busy, run } = useBusyAction()

  const onRequestCode = handleSubmit((data) =>
    run(async () => {
      setError('')
      setMessage('')
      setDevCode('')
      try {
        const response = await api.post('/api/auth/forgot-password', { email: data.email })
        const payload = response.data || {}
        setEmail(data.email)
        setMessage(
          payload.message
            || 'Código enviado. Confira sua caixa de entrada e o spam.',
        )
        const code = payload.developmentCode || ''
        setDevCode(code)
        reset({ code, newPassword: '' })
        if (code) setValue('code', code)
        setStep(2)
      } catch (err) {
        setError(err.response?.data?.message || 'Não foi possível enviar o código. Tente novamente.')
      }
    }),
  )

  const onResetPassword = handleSubmit((data) =>
    run(async () => {
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
    }),
  )

  return (
    <div className="flex min-h-screen bg-neon-bg">
      <div className="hidden w-1/2 flex-col justify-between bg-brand-pink p-12 text-brand-charcoal lg:flex dark:text-white">
        <Logo size="md" className="drop-shadow-md" />
        <div>
          <h2 className="font-display text-3xl font-bold">Recuperar acesso</h2>
          <p className="mt-2 opacity-80">Enviaremos um código para seu email</p>
        </div>
        <div>
          <div className="mb-4 h-px w-16 bg-current/40" />
          <p className="text-sm opacity-70">GIG — Moda Feminina</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <h1 className="font-display text-3xl font-bold text-neon-text">
          {step === 1 ? 'Esqueceu a senha?' : 'Redefinir senha'}
        </h1>
        <p className="mt-2 text-sm text-neon-muted">
          {step === 1
            ? 'Informe seu email e enviaremos um código de verificação.'
            : `Digite o código enviado para ${email} e sua nova senha.`}
        </p>

        {error && <div className="mt-4 admin-alert-err">{error}</div>}
        {message && <div className="mt-4 admin-alert-ok">{message}</div>}
        {devCode && (
          <div className="mt-4 rounded-xl border border-brand-purple/30 bg-brand-purple/10 px-4 py-3 text-center dark:border-neon-line/20 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wide text-neon-muted">Código de teste</p>
            <p className="mt-1 font-display text-3xl font-bold tracking-[0.35em] text-brand-purple dark:text-brand-pink">
              {devCode}
            </p>
            <p className="mt-2 text-xs text-neon-muted">
              O Gmail ainda não aceitou o envio. Enquanto isso, use este código.
            </p>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={onRequestCode} className="mt-8 space-y-5" aria-busy={busy}>
            <fieldset disabled={busy} className="min-w-0 space-y-5 border-0 p-0">
              <div>
                <label className="label-field">Email:</label>
                <input
                  {...register('email', { required: true })}
                  type="email"
                  placeholder="Digite o email"
                  className="input-field"
                  autoComplete="email"
                />
              </div>
            </fieldset>
            <div className="flex justify-end">
              <BusyButton type="submit" busy={busy} busyLabel="Enviando...">
                Enviar código
              </BusyButton>
            </div>
          </form>
        ) : (
          <form onSubmit={onResetPassword} className="mt-8 space-y-5" aria-busy={busy}>
            <fieldset disabled={busy} className="min-w-0 space-y-5 border-0 p-0">
              <div>
                <label className="label-field">Código de verificação:</label>
                <input
                  {...register('code', { required: true, pattern: /^\d{6}$/ })}
                  placeholder="000000"
                  maxLength={6}
                  className="input-field tracking-[0.5em]"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              </div>
              <div>
                <label className="label-field">Nova senha:</label>
                <input
                  {...register('newPassword', { required: true, minLength: 8 })}
                  type="password"
                  placeholder="Digite a nova senha"
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>
            </fieldset>
            <div className="flex justify-between gap-3">
              <BusyButton
                type="button"
                busy={false}
                disabled={busy}
                className="btn-outline"
                onClick={() => {
                  setStep(1)
                  setError('')
                  setMessage('')
                  setDevCode('')
                }}
              >
                Voltar
              </BusyButton>
              <BusyButton type="submit" busy={busy} busyLabel="Salvando...">
                Redefinir senha
              </BusyButton>
            </div>
          </form>
        )}

        <Link to="/?login=1" className="mt-6 text-sm text-brand-purple hover:underline dark:text-brand-pink">
          ← Voltar ao login
        </Link>
      </div>
    </div>
  )
}
