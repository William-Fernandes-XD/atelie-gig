import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'

/** Rota legada: abre o modal de pagamento e redireciona para meus pedidos. */
export default function OrderPaymentPage() {
  const { orderId } = useParams()
  const openPaymentModal = useUiStore((s) => s.openPaymentModal)

  useEffect(() => {
    if (orderId) {
      openPaymentModal(Number(orderId))
    }
  }, [orderId, openPaymentModal])

  return <Navigate to="/meus-pedidos" replace />
}
