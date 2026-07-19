import { create } from 'zustand'

export const useUiStore = create((set) => ({
  loginModalOpen: false,
  openLoginModal: () => set({ loginModalOpen: true }),
  closeLoginModal: () => set({ loginModalOpen: false }),

  paymentOrderId: null,
  openPaymentModal: (orderId) => set({ paymentOrderId: orderId }),
  closePaymentModal: () => set({ paymentOrderId: null }),

  toast: null,
  showToast: ({ message, type = 'info', durationMs = 5500 }) =>
    set({ toast: { message, type, durationMs } }),
  clearToast: () => set({ toast: null }),
}))
