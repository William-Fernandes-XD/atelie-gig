import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const WHOLESALE_THRESHOLD = 3

function getCartTotalQuantity(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

function getEffectivePrice(product, totalQuantity) {
  const price = totalQuantity > WHOLESALE_THRESHOLD ? product.wholesalePrice : product.price
  return Number(price)
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, color, size, quantity = 1) => {
        const items = [...get().items]
        const key = `${product.id}-${color}-${size}`
        const existing = items.find(
          (i) => i.product.id === product.id && i.color === color && i.size === size,
        )

        if (existing) {
          existing.quantity += quantity
        } else {
          items.push({ product, color, size, quantity })
        }

        set({ items })
      },

      removeItem: (productId, color, size) => {
        set({
          items: get().items.filter(
            (i) => !(i.product.id === productId && i.color === color && i.size === size),
          ),
        })
      },

      updateQuantity: (productId, color, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, color, size)
          return
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId && i.color === color && i.size === size
              ? { ...i, quantity }
              : i,
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      getTotalQuantity: () => getCartTotalQuantity(get().items),

      getSubtotal: () => {
        const totalQty = getCartTotalQuantity(get().items)
        return get().items.reduce((sum, item) => {
          const price = getEffectivePrice(item.product, totalQty)
          return sum + price * item.quantity
        }, 0)
      },

      isWholesaleApplied: () => getCartTotalQuantity(get().items) > WHOLESALE_THRESHOLD,

      getItemPrice: (item) => {
        const totalQty = getCartTotalQuantity(get().items)
        return getEffectivePrice(item.product, totalQty)
      },
    }),
    { name: 'atelie-cart' },
  ),
)
