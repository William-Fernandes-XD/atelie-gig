import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { ShippingArrangeDialog } from '../components/ShippingArrangeDialog'
import { SHIPPING_ARRANGE_CODE } from '../constants/contact'
import { invalidateStockRelatedQueries } from '../lib/queryClient'

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

function formatCep(value = '') {
  const digits = onlyDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const ARRANGE_OPTION = {
  serviceCode: SHIPPING_ARRANGE_CODE,
  serviceName: 'A combinar com o vendedor',
  price: 0,
  deadlineDays: 0,
  fromCorreios: false,
}

export default function CheckoutPage() {
  const queryClient = useQueryClient()
  const { items, clearCart, getSubtotal, isWholesaleApplied, getTotalQuantity } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const openLoginModal = useUiStore((s) => s.openLoginModal)
  const openPaymentModal = useUiStore((s) => s.openPaymentModal)
  const [error, setError] = useState('')
  const [quoteError, setQuoteError] = useState('')
  const [quoting, setQuoting] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [shippingOptions, setShippingOptions] = useState([ARRANGE_OPTION])
  const [selectedService, setSelectedService] = useState('')
  const [arrangeDialogOpen, setArrangeDialogOpen] = useState(false)
  const submittingRef = useRef(false)
  const lastQuotedCep = useRef('')

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm()
  const cepValue = watch('cep')

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/api/me')).data,
    enabled: !!token,
  })

  useEffect(() => {
    if (!user || !profile?.address) return
    const addr = profile.address
    reset({
      cep: addr.cep || '',
      street: addr.street || '',
      number: addr.number || '',
      neighborhood: addr.neighborhood || '',
      city: addr.city || '',
      state: addr.state || '',
      complement: addr.complement || '',
      reference: addr.reference || '',
    })
  }, [user, profile, reset])

  const subtotal = getSubtotal()
  const selectedOption = shippingOptions.find((o) => o.serviceCode === selectedService)
  const isArrange = selectedService === SHIPPING_ARRANGE_CODE
  const shippingCost = Number(selectedOption?.price || 0)
  const total = subtotal + shippingCost

  const mergeOptions = (apiOptions = []) => {
    const withoutArrange = apiOptions.filter((o) => o.serviceCode !== SHIPPING_ARRANGE_CODE)
    return [...withoutArrange, ARRANGE_OPTION]
  }

  const selectShipping = (serviceCode) => {
    setSelectedService(serviceCode)
    if (serviceCode === SHIPPING_ARRANGE_CODE) {
      setArrangeDialogOpen(true)
    }
  }

  const quoteShipping = async (rawCep) => {
    const cep = onlyDigits(rawCep)
    if (cep.length !== 8 || items.length === 0) return

    setQuoting(true)
    setQuoteError('')
    try {
      const { data } = await api.post('/api/shipping/quote', {
        destinationCep: cep,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      })
      const options = mergeOptions(data.options || [])
      setShippingOptions(options)
      lastQuotedCep.current = cep
      setSelectedService((current) => {
        if (current && options.some((o) => o.serviceCode === current)) {
          return current
        }
        return options[0]?.serviceCode || ''
      })
    } catch (err) {
      setShippingOptions([ARRANGE_OPTION])
      setSelectedService((current) => (current === SHIPPING_ARRANGE_CODE ? current : ''))
      setQuoteError(err.response?.data?.message || 'Não foi possível calcular o frete. Verifique o CEP.')
    } finally {
      setQuoting(false)
    }
  }

  const lookupCep = async (rawCep) => {
    const cep = onlyDigits(rawCep)
    if (cep.length !== 8) return
    setCepLoading(true)
    setError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data?.erro) {
        setError('CEP não encontrado. Preencha o endereço manualmente.')
      } else {
        setValue('street', data.logradouro || '')
        setValue('neighborhood', data.bairro || '')
        setValue('city', data.localidade || '')
        setValue('state', data.uf || '')
      }
      await quoteShipping(cep)
    } catch {
      setError('Não foi possível consultar o CEP. Preencha o endereço e calcule o frete.')
    } finally {
      setCepLoading(false)
    }
  }

  useEffect(() => {
    const cep = onlyDigits(cepValue)
    if (cep.length === 8 && cep !== lastQuotedCep.current) {
      const timer = setTimeout(() => quoteShipping(cep), 400)
      return () => clearTimeout(timer)
    }
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepValue, items.length, getTotalQuantity()])

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p>Carrinho vazio.</p>
        <Link to="/" className="btn-primary mt-4 inline-block">Voltar à loja</Link>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-bold">Faça login para continuar</h1>
        <p className="mt-2 text-sm text-brand-muted">
          É necessário ter uma conta para finalizar a compra e acompanhar seus pedidos.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button type="button" onClick={openLoginModal} className="btn-primary">
            Entrar
          </button>
          <Link to="/cadastro" className="btn-outline">Criar conta</Link>
        </div>
      </div>
    )
  }

  const onSubmit = async (data) => {
    if (submittingRef.current) return
    if (!selectedService) {
      setError('Calcule e selecione uma opção de frete para continuar.')
      return
    }
    submittingRef.current = true
    setError('')
    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.product.id,
          colorName: i.color,
          sizeName: i.size,
          quantity: i.quantity,
        })),
        shipping: {
          cep: data.cep,
          street: data.street,
          number: data.number,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          complement: data.complement,
          reference: data.reference,
        },
        shippingServiceCode: selectedService,
      }

      const response = await api.post('/api/checkout', payload)
      clearCart()
      invalidateStockRelatedQueries(queryClient)
      openPaymentModal(response.data.orderId)
    } catch (err) {
      submittingRef.current = false
      const status = err.response?.status
      if (status === 401 || status === 403) {
        setError('Sua sessão expirou. Faça login novamente para finalizar a compra.')
        openLoginModal()
        return
      }
      setError(err.response?.data?.message || 'Erro ao processar checkout.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-bold">Checkout</h1>

      <div className="mt-4 space-y-2 rounded-xl border border-brand-pink/30 bg-brand-pink/10 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-muted">Subtotal dos produtos</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-muted">
            Frete{selectedOption ? ` (${selectedOption.serviceName})` : ''}
          </span>
          <span className="font-medium">
            {!selectedOption ? '—' : isArrange ? 'A combinar' : formatCurrency(shippingCost)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-brand-pink/30 pt-2">
          <span className="font-semibold text-brand-charcoal">Total</span>
          <span className="text-lg font-bold text-brand-purple">
            {isArrange ? `${formatCurrency(subtotal)} + frete` : formatCurrency(total)}
          </span>
        </div>
        {isWholesaleApplied() && (
          <p className="text-xs text-brand-purple">Preço de atacado aplicado (mais de 3 peças).</p>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            {...register('cep', {
              required: true,
              onChange: (e) => setValue('cep', formatCep(e.target.value)),
            })}
            placeholder="CEP"
            className="input-field sm:flex-1"
            inputMode="numeric"
          />
          <button
            type="button"
            onClick={() => lookupCep(cepValue)}
            disabled={cepLoading || onlyDigits(cepValue).length !== 8}
            className="btn-outline px-5 py-3 text-sm disabled:opacity-50"
          >
            {cepLoading ? 'Buscando...' : 'Buscar CEP'}
          </button>
        </div>
        <input {...register('street', { required: true })} placeholder="Rua" className="input-field" />
        <div className="grid grid-cols-2 gap-4">
          <input {...register('number', { required: true })} placeholder="Número" className="input-field" />
          <input {...register('neighborhood', { required: true })} placeholder="Bairro" className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input {...register('city', { required: true })} placeholder="Cidade" className="input-field" />
          <input {...register('state', { required: true, maxLength: 2 })} placeholder="UF" className="input-field" />
        </div>
        <input {...register('complement')} placeholder="Complemento (opcional)" className="input-field" />
        <input {...register('reference')} placeholder="Referência (opcional)" className="input-field" />

        <section className="rounded-2xl border border-brand-pink/40 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-semibold">Entrega</h3>
            <button
              type="button"
              onClick={() => quoteShipping(cepValue)}
              disabled={quoting || onlyDigits(cepValue).length !== 8}
              className="text-sm font-medium text-brand-purple hover:underline disabled:opacity-50"
            >
              {quoting ? 'Calculando...' : 'Calcular frete Correios'}
            </button>
          </div>
          <p className="mt-1 text-xs text-brand-muted">
            Escolha PAC, SEDEX ou combine o frete diretamente com o vendedor.
          </p>

          {quoteError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{quoteError}</p>
          )}

          {quoting && (
            <p className="mt-3 text-sm text-brand-muted">Calculando frete...</p>
          )}

          <div className="mt-4 space-y-2">
            {shippingOptions.map((option) => {
              const active = selectedService === option.serviceCode
              const arrange = option.serviceCode === SHIPPING_ARRANGE_CODE
              return (
                <label
                  key={option.serviceCode}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                    active
                      ? 'border-brand-purple bg-brand-purple/10'
                      : 'border-gray-200 bg-gray-50 hover:border-brand-pink'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingService"
                      value={option.serviceCode}
                      checked={active}
                      onChange={() => selectShipping(option.serviceCode)}
                      className="text-brand-purple focus:ring-brand-purple/30"
                    />
                    <span>
                      <span className="block font-semibold text-brand-charcoal">
                        {option.serviceName}
                      </span>
                      <span className="text-xs text-brand-muted">
                        {arrange
                          ? 'Combinamos o frete pelo WhatsApp / telefone'
                          : `Prazo estimado: ${option.deadlineDays} dia(s) útil(eis)`}
                      </span>
                    </span>
                  </span>
                  <span className="font-bold text-brand-purple">
                    {arrange ? 'A combinar' : formatCurrency(option.price)}
                  </span>
                </label>
              )
            })}
          </div>

          {!quoting && shippingOptions.every((o) => o.serviceCode === SHIPPING_ARRANGE_CODE) && (
            <p className="mt-3 text-sm text-brand-muted">
              Informe o CEP e calcule o frete para ver também PAC e SEDEX.
            </p>
          )}
        </section>

        <button
          type="submit"
          disabled={isSubmitting || !selectedService}
          className="btn-primary w-full disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? 'Processando...'
            : isArrange
              ? `Continuar para pagamento · ${formatCurrency(subtotal)}`
              : `Continuar para pagamento · ${formatCurrency(total)}`}
        </button>
      </form>

      <ShippingArrangeDialog
        open={arrangeDialogOpen}
        onClose={() => setArrangeDialogOpen(false)}
        phone={profile?.phone}
      />
    </div>
  )
}
