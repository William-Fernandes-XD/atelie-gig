import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

function formatCep(value = '') {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatCpf(value = '') {
  const digits = onlyDigits(value).slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatPhone(value = '') {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs text-red-600 dark:text-red-300">{message}</p>
}

export default function ProfilePage() {
  const token = useAuthStore((s) => s.token)
  const updateUser = useAuthStore((s) => s.updateUser)
  const showToast = useUiStore((s) => s.showToast)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [error, setError] = useState('')
  const [cepLoading, setCepLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
  })

  const cepValue = watch('cep')

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/api/me')).data,
    enabled: !!token,
  })

  useEffect(() => {
    if (!profile) return
    reset({
      name: profile.name || '',
      phone: profile.phone || '',
      cpf: profile.cpf || '',
      cep: profile.address?.cep || '',
      street: profile.address?.street || '',
      number: profile.address?.number || '',
      neighborhood: profile.address?.neighborhood || '',
      city: profile.address?.city || '',
      state: profile.address?.state || '',
      complement: profile.address?.complement || '',
      reference: profile.address?.reference || '',
    })
  }, [profile, reset])

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let updated = (await api.put('/api/me', data)).data
      if (photoFile) {
        const formData = new FormData()
        formData.append('photo', photoFile)
        updated = (await api.post('/api/me/photo', formData)).data
      }
      return updated
    },
    onSuccess: (updated) => {
      updateUser({
        name: updated.name,
        profilePhotoUrl: updated.profilePhotoUrl,
      })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setPhotoFile(null)
      setPhotoPreview(null)
      setError('')
      showToast({
        type: 'info',
        message: 'Dados alterados com sucesso!',
        durationMs: 5000,
      })
      navigate('/', { replace: true })
    },
    onError: (err) => {
      const details = err.response?.data?.details
      setError(details ? Object.values(details).join(' ') : err.response?.data?.message || 'Erro ao salvar.')
    },
  })

  if (!token) {
    return <Navigate to="/?login=1" replace />
  }

  const baseUrl = import.meta.env.VITE_API_URL || ''
  const currentPhoto = photoPreview || (profile?.profilePhotoUrl ? `${baseUrl}${profile.profilePhotoUrl}` : null)

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const lookupCep = async (rawCep = cepValue) => {
    const cep = onlyDigits(rawCep)
    if (cep.length !== 8) {
      setError('Informe um CEP válido com 8 dígitos para buscar.')
      return
    }

    setCepLoading(true)
    setError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data?.erro) {
        setError('CEP não encontrado. Preencha o endereço manualmente.')
        return
      }
      setValue('cep', formatCep(cep), { shouldValidate: true })
      setValue('street', data.logradouro || '', { shouldValidate: true })
      setValue('neighborhood', data.bairro || '', { shouldValidate: true })
      setValue('city', data.localidade || '', { shouldValidate: true })
      setValue('state', (data.uf || '').toUpperCase(), { shouldValidate: true })
    } catch {
      setError('Não foi possível consultar o CEP. Preencha o endereço manualmente.')
    } finally {
      setCepLoading(false)
    }
  }

  const onSubmit = (data) => {
    setError('')

    const cep = formatCep(data.cep)
    const cpf = formatCpf(data.cpf)
    const phone = formatPhone(data.phone)
    const state = String(data.state || '').trim().toUpperCase()

    if (onlyDigits(cep).length !== 8) {
      setError('Informe um CEP válido com 8 dígitos.')
      return
    }
    if (onlyDigits(cpf).length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.')
      return
    }
    if (state.length !== 2) {
      setError('Informe a UF com 2 letras (ex.: SP).')
      return
    }

    saveMutation.mutate({
      ...data,
      name: String(data.name || '').trim(),
      phone,
      cpf,
      cep,
      street: String(data.street || '').trim(),
      number: String(data.number || '').trim(),
      neighborhood: String(data.neighborhood || '').trim(),
      city: String(data.city || '').trim(),
      state,
      complement: String(data.complement || '').trim() || null,
      reference: String(data.reference || '').trim() || null,
    })
  }

  const onInvalid = () => {
    setError('Preencha todos os campos obrigatórios para salvar.')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="admin-page-title">Minha conta</h1>
        <p className="admin-page-sub">
          Preencha seus dados e endereço para agilizar suas compras na loja.
        </p>
      </div>

      {error && <div className="mb-6 admin-alert-err">{error}</div>}

      {isLoading ? (
        <p className="text-neon-muted">Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6" aria-busy={isSubmitting || saveMutation.isPending}>
          <section className="admin-card flex flex-col items-center gap-3 !py-8">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-28 w-28 overflow-hidden rounded-full border-2 border-dashed border-brand-pink/60 bg-brand-pink/15 ring-4 ring-brand-pink/10 transition hover:border-brand-purple dark:border-neon-line/25 dark:bg-white/5 dark:ring-white/5 dark:hover:border-brand-pink/50"
            >
              {currentPhoto ? (
                <img src={currentPhoto} alt="Sua foto" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-neon-muted">Sua foto</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-neon-muted">Foto de perfil (opcional) — clique para alterar</p>
          </section>

          <section className="admin-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-neon-text">Dados pessoais</h2>
            <div>
              <label className="label-field">Nome completo</label>
              <input
                {...register('name', { required: 'Nome é obrigatório' })}
                placeholder="Seu nome"
                className="input-field"
                autoComplete="name"
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input
                value={profile?.email || ''}
                readOnly
                placeholder="Email"
                className="input-field cursor-not-allowed opacity-80 dark:bg-neon-card/30"
              />
            </div>
            <div>
              <label className="label-field">Telefone</label>
              <input
                {...register('phone', {
                  required: 'Telefone é obrigatório',
                  onChange: (e) => {
                    setValue('phone', formatPhone(e.target.value), { shouldValidate: true })
                  },
                })}
                placeholder="(11) 99999-9999"
                className="input-field"
                inputMode="tel"
                autoComplete="tel"
              />
              <FieldError message={errors.phone?.message} />
            </div>
            <div>
              <label className="label-field">CPF</label>
              <input
                {...register('cpf', {
                  required: 'CPF é obrigatório',
                  onChange: (e) => {
                    setValue('cpf', formatCpf(e.target.value), { shouldValidate: true })
                  },
                })}
                placeholder="000.000.000-00"
                className="input-field"
                inputMode="numeric"
              />
              <FieldError message={errors.cpf?.message} />
            </div>
          </section>

          <section className="admin-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-neon-text">Endereço de entrega</h2>
            <div>
              <label className="label-field">CEP</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  {...register('cep', {
                    required: 'CEP é obrigatório',
                    onChange: (e) => {
                      setValue('cep', formatCep(e.target.value), { shouldValidate: true })
                    },
                  })}
                  placeholder="00000-000"
                  className="input-field sm:flex-1"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  onClick={() => lookupCep(cepValue)}
                  disabled={cepLoading || onlyDigits(cepValue).length !== 8}
                  className="btn-outline px-5 py-3 text-sm disabled:pointer-events-none disabled:opacity-50"
                >
                  {cepLoading ? 'Buscando...' : 'Buscar CEP'}
                </button>
              </div>
              <FieldError message={errors.cep?.message} />
              <p className="mt-1.5 text-xs text-neon-muted">
                Digite o CEP e clique em buscar para preencher rua, bairro, cidade e UF.
              </p>
            </div>
            <div>
              <label className="label-field">Rua</label>
              <input
                {...register('street', { required: 'Rua é obrigatória' })}
                placeholder="Rua / Avenida"
                className="input-field"
                autoComplete="street-address"
              />
              <FieldError message={errors.street?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Número</label>
                <input
                  {...register('number', { required: 'Número é obrigatório' })}
                  placeholder="Nº"
                  className="input-field"
                />
                <FieldError message={errors.number?.message} />
              </div>
              <div>
                <label className="label-field">Bairro</label>
                <input
                  {...register('neighborhood', { required: 'Bairro é obrigatório' })}
                  placeholder="Bairro"
                  className="input-field"
                />
                <FieldError message={errors.neighborhood?.message} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">Cidade</label>
                <input
                  {...register('city', { required: 'Cidade é obrigatória' })}
                  placeholder="Cidade"
                  className="input-field"
                />
                <FieldError message={errors.city?.message} />
              </div>
              <div>
                <label className="label-field">UF</label>
                <input
                  {...register('state', {
                    required: 'UF é obrigatória',
                    minLength: { value: 2, message: 'UF com 2 letras' },
                    maxLength: { value: 2, message: 'UF com 2 letras' },
                    onChange: (e) => {
                      setValue('state', e.target.value.toUpperCase().slice(0, 2), { shouldValidate: true })
                    },
                  })}
                  placeholder="SP"
                  className="input-field uppercase"
                  maxLength={2}
                />
                <FieldError message={errors.state?.message} />
              </div>
            </div>
            <div>
              <label className="label-field">Complemento</label>
              <input {...register('complement')} placeholder="Apto, bloco... (opcional)" className="input-field" />
            </div>
            <div>
              <label className="label-field">Referência</label>
              <input {...register('reference')} placeholder="Ponto de referência (opcional)" className="input-field" />
            </div>
          </section>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || saveMutation.isPending}
              className="btn-primary disabled:pointer-events-none disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar dados'}
            </button>
            <Link to="/" className="btn-outline">Voltar à loja</Link>
          </div>
        </form>
      )}
    </div>
  )
}
