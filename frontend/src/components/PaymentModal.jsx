import { useNavigate } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { OrderPaymentContent } from './OrderPaymentContent'

export function PaymentModal() {
  const paymentOrderId = useUiStore((s) => s.paymentOrderId)
  const closePaymentModal = useUiStore((s) => s.closePaymentModal)
  const showToast = useUiStore((s) => s.showToast)
  const navigate = useNavigate()

  if (!paymentOrderId) return null

  const handleSuccess = () => {
    closePaymentModal()
    showToast({
      type: 'success',
      message: 'Pagamento aprovado! Você pode conferir os detalhes em Meus pedidos.',
    })
    navigate('/meus-pedidos')
  }

  const handleCancelled = () => {
    closePaymentModal()
    showToast({
      type: 'info',
      message: 'Pedido cancelado com sucesso.',
    })
    navigate('/meus-pedidos')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closePaymentModal}
        aria-label="Fechar"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-brand-pink/30 px-5 py-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-brand-charcoal">Pagamento</h2>
            <p className="text-xs text-brand-muted">PIX ou cartão de crédito</p>
          </div>
          <button
            type="button"
            onClick={closePaymentModal}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-muted shadow-sm hover:text-brand-charcoal"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <OrderPaymentContent
            orderId={paymentOrderId}
            onSuccess={handleSuccess}
            onCancel={handleCancelled}
            onClose={closePaymentModal}
            compact
          />
        </div>
      </div>
    </div>
  )
}
