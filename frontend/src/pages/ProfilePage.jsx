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
  return <p className="mt-1 text-xs text-red-600">{message}</p>
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
  })

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
        updated = (await api.post('/api/me/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })).data
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
      <h1 className="font-serif text-3xl font-bold">Minha conta</h1>
      <p className="mt-2 text-sm text-brand-muted">
        Preencha seus dados e endereço para agilizar suas compras na loja.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {isLoading ? (
        <p className="mt-8">Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-brand-purple bg-brand-pink/20"
            >
              {currentPhoto ? (
                <img src={currentPhoto} alt="Sua foto" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-brand-muted">Sua foto</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-brand-muted">Foto de perfil (opcional)</p>
          </div>

          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-semibold">Dados pessoais</h2>
            <div>
              <input
                {...register('name', { required: 'Nome é obrigatório' })}
                placeholder="Nome completo"
                className="input-field"
              />
              <FieldError message={errors.name?.message} />
            </div>
            <input
              value={profile?.email || ''}
              readOnly
              placeholder="Email"
              className="input-field cursor-not-allowed bg-gray-50"
            />
            <div>
              <input
                {...register('phone', {
                  required: 'Telefone é obrigatório',
                  onChange: (e) => {
                    setValue('phone', formatPhone(e.target.value), { shouldValidate: true })
                  },
                })}
                placeholder="Telefone"
                className="input-field"
              />
              <FieldError message={errors.phone?.message} />
            </div>
            <div>
              <input
                {...register('cpf', {
                  required: 'CPF é obrigatório',
                  onChange: (e) => {
                    setValue('cpf', formatCpf(e.target.value), { shouldValidate: true })
                  },
                })}
                placeholder="CPF"
                className="input-field"
              />
              <FieldError message={errors.cpf?.message} />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-semibold">Endereço de entrega</h2>
            <div>
              <input
                {...register('cep', {
                  required: 'CEP é obrigatório',
                  onChange: (e) => {
                    setValue('cep', formatCep(e.target.value), { shouldValidate: true })
                  },
                })}
                placeholder="CEP"
                className="input-field"
              />
              <FieldError message={errors.cep?.message} />
            </div>
            <div>
              <input
                {...register('street', { required: 'Rua é obrigatória' })}
                placeholder="Rua"
                className="input-field"
              />
              <FieldError message={errors.street?.message} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  {...register('number', { required: 'Número é obrigatório' })}
                  placeholder="Número"
                  className="input-field"
                />
                <FieldError message={errors.number?.message} />
              </div>
              <div>
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
                <input
                  {...register('city', { required: 'Cidade é obrigatória' })}
                  placeholder="Cidade"
                  className="input-field"
                />
                <FieldError message={errors.city?.message} />
              </div>
              <div>
                <input
                  {...register('state', {
                    required: 'UF é obrigatória',
                    minLength: { value: 2, message: 'UF com 2 letras' },
                    maxLength: { value: 2, message: 'UF com 2 letras' },
                    onChange: (e) => {
                      setValue('state', e.target.value.toUpperCase().slice(0, 2), { shouldValidate: true })
                    },
                  })}
                  placeholder="UF"
                  className="input-field uppercase"
                  maxLength={2}
                />
                <FieldError message={errors.state?.message} />
              </div>
            </div>
            <input {...register('complement')} placeholder="Complemento (opcional)" className="input-field" />
            <input {...register('reference')} placeholder="Referência (opcional)" className="input-field" />
          </section>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={isSubmitting || saveMutation.isPending} className="btn-primary">
              {saveMutation.isPending ? 'Salvando...' : 'Salvar dados'}
            </button>
            <Link to="/" className="btn-outline">Voltar à loja</Link>
          </div>
        </form>
      )}
    </div>
  )
}
