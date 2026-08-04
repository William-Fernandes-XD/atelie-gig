import { create } from 'zustand'

export const useUiStore = create((set) => ({
  loginModalOpen: false,
  openLoginModal: () => set({ loginModalOpen: true }),
  closeLoginModal: () => set({ loginModalOpen: false }),

  paymentOrderId: null,
  openPaymentModal: (orderId) => set({ paymentOrderId: orderId }),
  closePaymentModal: () => set({ paymentOrderId: null }),

  toast: null,
  /**
   * @param {{ message: string, type?: 'info'|'success'|'error'|'warn', title?: string, actionLabel?: string, actionTo?: string, durationMs?: number }} payload
   */
  showToast: ({
    message,
    type = 'info',
    title,
    actionLabel,
    actionTo,
    durationMs = 4500,
  }) =>
    set({
      toast: {
        id: Date.now(),
        message,
        type,
        title,
        actionLabel,
        actionTo,
        durationMs,
      },
    }),
  clearToast: () => set({ toast: null }),
}))
