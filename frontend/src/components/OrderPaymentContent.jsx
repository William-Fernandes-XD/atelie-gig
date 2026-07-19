import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '')
}

function formatCpf(value = '') {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function loadMercadoPagoSdk() {
  if (window.MercadoPago) return Promise.resolve()

  const existing = document.querySelector('script[data-mp-sdk="v2"]')
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar Mercado Pago')), { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.dataset.mpSdk = 'v2'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar Mercado Pago'))
    document.body.appendChild(script)
  })
}

export function OrderPaymentContent({ orderId, onSuccess, onCancel, onClose, compact = false }) {
  const reactId = useId().replace(/:/g, '')
  const brickContainerId = `cardPaymentBrick-${orderId}-${reactId}`

  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [method, setMethod] = useState('pix')
  const [pixData, setPixData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [cpf, setCpf] = useState('')
  const brickControllerRef = useRef(null)
  const submittingRef = useRef(false)
  const cpfRef = useRef(cpf)
  const payWithCardTokenRef = useRef(null)

  useEffect(() => {
    cpfRef.current = cpf
  }, [cpf])

  const { data: order, refetch: refetchOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => (await api.get(`/api/orders/${orderId}`)).data,
    enabled: !!orderId,
  })

  const { data: mpConfig } = useQuery({
    queryKey: ['mp-config'],
    queryFn: async () => (await api.get('/api/payments/config')).data,
  })

  const handleSuccess = useCallback((orderNumber) => {
    queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    onSuccess?.(orderNumber)
  }, [queryClient, orderId, onSuccess])

  const needsCpf = Boolean(order?.requiresCpf)

  useEffect(() => {
    if (!orderId || !order?.canPay) return
    api.get(`/api/orders/${orderId}/payment-status`)
      .then((res) => {
        if (res.data.orderPaid) {
          handleSuccess(order.orderNumber)
          return
        }
        if (res.data.pixQrCode) {
          setPixData(res.data)
          setMethod('pix')
        }
      })
      .catch(() => {})
  }, [orderId, order?.canPay, order?.orderNumber, handleSuccess])

  const payWithCardToken = useCallback(async (formData) => {
    setError('')
    setLoading(true)
    try {
      const token = formData?.token
      const paymentMethodId = formData?.payment_method_id || formData?.paymentMethodId
      const installments = Number(formData?.installments || 1)
      const issuerId = formData?.issuer_id != null
        ? String(formData.issuer_id)
        : (formData?.issuerId != null ? String(formData.issuerId) : null)

      if (!token || !paymentMethodId) {
        throw new Error('Não foi possível tokenizar o cartão. Verifique os dados e tente novamente.')
      }

      let payerCpf = formData?.payer?.identification?.number
        || formData?.identificationNumber
        || ''

      if (needsCpf) {
        if (onlyDigits(cpfRef.current).length !== 11) {
          throw new Error('Informe um CPF válido com 11 dígitos.')
        }
        payerCpf = formatCpf(cpfRef.current)
      }

      if (!payerCpf || onlyDigits(payerCpf).length !== 11) {
        throw new Error('Informe um CPF válido com 11 dígitos no formulário do cartão.')
      }

      const res = await api.post(`/api/orders/${orderId}/pay/card`, {
        token,
        paymentMethodId,
        installments,
        issuerId,
        payerEmail: formData?.payer?.email || user?.email,
        payerName: user?.name || formData?.payer?.email || 'Cliente',
        payerCpf: formatCpf(payerCpf),
      })

      if (needsCpf) {
        updateUser({ cpf: formatCpf(payerCpf) })
      }

      if (res.data.orderPaid || res.data.status === 'APPROVED') {
        handleSuccess(order?.orderNumber)
        return
      }

      throw new Error(res.data.statusDetail || 'Pagamento não aprovado. Tente novamente.')
    } catch (err) {
      const status = err.response?.status
      let message = err.message || 'Erro ao processar cartão.'
      if (status === 401 || status === 403) {
        message = 'Sua sessão expirou. Faça login novamente para pagar.'
      } else if (err.response?.data?.message) {
        message = err.response.data.message
      }
      setError(message)
      refetchOrder()
      throw err
    } finally {
      setLoading(false)
    }
  }, [orderId, user, order?.orderNumber, handleSuccess, refetchOrder, needsCpf, updateUser])

  useEffect(() => {
    payWithCardTokenRef.current = payWithCardToken
  }, [payWithCardToken])

  useEffect(() => {
    if (!mpConfig?.publicKey || method !== 'card' || !order) {
      setCardReady(false)
      return undefined
    }

    let cancelled = false

    const destroyBrick = async () => {
      try {
        await brickControllerRef.current?.unmount?.()
      } catch {
        // ignore
      }
      brickControllerRef.current = null
    }

    const mountBrick = async () => {
      setCardReady(false)
      await destroyBrick()
      if (cancelled) return

      const container = document.getElementById(brickContainerId)
      if (!container) {
        window.setTimeout(() => {
          if (!cancelled) mountBrick()
        }, 50)
        return
      }

      container.innerHTML = ''

      try {
        await loadMercadoPagoSdk()
        if (cancelled || !window.MercadoPago) return

        const mp = new window.MercadoPago(mpConfig.publicKey, { locale: 'pt-BR' })
        const bricksBuilder = mp.bricks()
        const amount = Number(order.total)

        const controller = await bricksBuilder.create('cardPayment', brickContainerId, {
          initialization: {
            amount,
            payer: {
              email: user?.email || undefined,
            },
          },
          customization: {
            visual: {
              style: {
                theme: 'default',
              },
            },
            paymentMethods: {
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) {
                setCardReady(true)
                setError('')
              }
            },
            onError: (err) => {
              console.error('Mercado Pago Brick error', err)
              if (!cancelled) {
                setCardReady(false)
                setError('Não foi possível carregar o formulário de cartão. Recarregue e tente novamente.')
              }
            },
            onSubmit: (formData) => {
              if (submittingRef.current) {
                return Promise.reject(new Error('Pagamento já em andamento.'))
              }
              submittingRef.current = true
              return payWithCardTokenRef.current(formData)
                .finally(() => {
                  submittingRef.current = false
                })
            },
          },
        })

        if (cancelled) {
          try {
            await controller?.unmount?.()
          } catch {
            // ignore
          }
          return
        }
        brickControllerRef.current = controller
      } catch (err) {
        console.error('Falha ao montar Card Payment Brick', err)
        if (!cancelled) {
          setCardReady(false)
          setError(err.message || 'Falha ao carregar o formulário de cartão.')
        }
      }
    }

    mountBrick()

    return () => {
      cancelled = true
      destroyBrick()
      setCardReady(false)
    }
  }, [mpConfig?.publicKey, method, order?.id, order?.total, brickContainerId, user?.email])

  useEffect(() => {
    if (!pixData || pixData.orderPaid) return undefined
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/orders/${orderId}/payment-status`)
        if (res.data.orderPaid) {
          handleSuccess(order?.orderNumber)
        }
      } catch {
        // ignore polling errors
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [pixData, orderId, order?.orderNumber, handleSuccess])

  const handleGeneratePix = async () => {
    setError('')
    if (needsCpf && onlyDigits(cpf).length !== 11) {
      setError('Informe um CPF válido com 11 dígitos.')
      return
    }
    setLoading(true)
    try {
      const body = needsCpf ? { payerCpf: formatCpf(cpf) } : {}
      const res = await api.post(`/api/orders/${orderId}/pay/pix`, body)
      if (needsCpf) {
        updateUser({ cpf: formatCpf(cpf) })
      }
      setPixData(res.data)
      if (res.data.orderPaid) {
        handleSuccess(order?.orderNumber)
      }
    } catch (err) {
      const status = err.response?.status
      if (status === 401 || status === 403) {
        setError('Sua sessão expirou. Faça login novamente para pagar.')
      } else {
        setError(err.response?.data?.message || 'Erro ao gerar PIX.')
      }
    } finally {
      setLoading(false)
    }
  }

  const copyPixCode = () => {
    if (pixData?.pixQrCode) {
      navigator.clipboard.writeText(pixData.pixQrCode)
    }
  }

  const handleCancelOrder = async () => {
    const confirmed = window.confirm(
      'Cancelar este pedido? O QR Code PIX será invalidado e o estoque será liberado.',
    )
    if (!confirmed) return

    setError('')
    setLoading(true)
    try {
      await api.post(`/api/orders/${orderId}/cancel`)
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      onCancel?.()
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        setError('Sua sessão expirou. Faça login novamente.')
      } else {
        setError(err.response?.data?.message || 'Erro ao cancelar o pedido.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!order) {
    return <p className="py-8 text-center text-sm text-brand-muted">Carregando pedido...</p>
  }

  if (order.status === 'PAID') {
    return (
      <div className="py-8 text-center">
        <p className="font-serif text-xl font-bold">Pedido já pago</p>
        <p className="mt-2 text-sm text-brand-muted">{order.orderNumber}</p>
      </div>
    )
  }

  if (!order.canPay) {
    return (
      <div className="py-8 text-center">
        <p className="font-serif text-xl font-bold">Pagamento indisponível</p>
        <p className="mt-2 text-sm text-brand-muted">Este pedido expirou ou foi cancelado.</p>
      </div>
    )
  }

  return (
    <div>
      <div className={compact ? '' : 'mx-auto max-w-2xl px-4 py-4 sm:px-6'}>
        {!compact && (
          <h1 className="font-serif text-3xl font-bold">Pagamento</h1>
        )}
        <p className={`text-sm text-brand-muted ${compact ? '' : 'mt-1'}`}>
          Pedido <span className="font-medium">{order.orderNumber}</span> — Total:{' '}
          <span className="font-bold text-brand-purple">{formatCurrency(order.total)}</span>
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {needsCpf && (
          <div className="mt-4">
            <label className="label-field" htmlFor={`payer-cpf-${reactId}`}>
              CPF
            </label>
            <input
              id={`payer-cpf-${reactId}`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => {
                setCpf(formatCpf(e.target.value))
                if (error) setError('')
              }}
              className="input-field"
            />
            <p className="mt-1 text-xs text-brand-muted">
              Necessário para o pagamento. Será salvo na sua conta ao pagar.
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMethod('pix')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
              method === 'pix' ? 'border-brand-purple bg-brand-purple text-white' : 'border-gray-200 bg-white'
            }`}
          >
            PIX
          </button>
          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
              method === 'card' ? 'border-brand-purple bg-brand-purple text-white' : 'border-gray-200 bg-white'
            }`}
          >
            Cartão de crédito
          </button>
        </div>

        <div className={`mt-4 rounded-2xl bg-gray-50 p-4 ${compact ? '' : 'shadow-sm'}`}>
          {method === 'pix' ? (
            <div className="space-y-4">
              {!pixData ? (
                <>
                  <p className="text-sm text-brand-muted">
                    Gere o QR Code PIX e pague pelo app do seu banco. A confirmação é automática.
                  </p>
                  <button
                    type="button"
                    onClick={handleGeneratePix}
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
                  </button>
                </>
              ) : (
                <>
                  {pixData.pixQrCodeBase64 && (
                    <img
                      src={`data:image/png;base64,${pixData.pixQrCodeBase64}`}
                      alt="QR Code PIX"
                      className="mx-auto h-48 w-48"
                    />
                  )}
                  {pixData.pixQrCode && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Pix Copia e Cola</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={pixData.pixQrCode}
                          className="input-field flex-1 text-xs"
                        />
                        <button type="button" onClick={copyPixCode} className="btn-outline shrink-0 px-4">
                          Copiar
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-center text-sm text-brand-muted">
                    Aguardando confirmação do pagamento...
                  </p>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={loading}
                    className="w-full rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {loading ? 'Cancelando...' : 'Cancelar pedido'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-brand-muted">
                Digite os dados do cartão no formulário abaixo.
              </p>
              {!mpConfig?.publicKey ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Pagamento com cartão indisponível: chave pública do Mercado Pago não configurada.
                </p>
              ) : (
                <>
                  {!cardReady && !error && (
                    <p className="mb-3 text-center text-xs text-brand-muted">
                      Carregando formulário seguro do Mercado Pago...
                    </p>
                  )}
                  {loading && (
                    <p className="mb-3 text-center text-xs text-brand-purple">
                      Processando pagamento...
                    </p>
                  )}
                  <div
                    id={brickContainerId}
                    className="min-h-[320px] overflow-hidden rounded-xl bg-white"
                  />
                </>
              )}
            </div>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full text-center text-sm text-brand-muted hover:text-brand-purple"
          >
            Fechar e pagar depois
          </button>
        )}
      </div>
    </div>
  )
}
