import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, isWholesaleApplied, getItemPrice, clearCart } =
    useCartStore()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-serif text-3xl font-bold">Seu carrinho está vazio</h1>
        <p className="mt-4 text-brand-muted">Explore nossa coleção e encontre o vestido perfeito.</p>
        <Link to="/" className="btn-primary mt-8 inline-block">
          Continuar comprando
        </Link>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const wholesale = isWholesaleApplied()

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-bold">Carrinho</h1>

      {wholesale && (
        <div className="mt-4 rounded-xl bg-brand-pink/40 px-4 py-3 text-sm">
          Preço de atacado aplicado — mais de 3 peças no carrinho.
        </div>
      )}

      <div className="mt-8 space-y-4">
        {items.map((item) => {
          const price = getItemPrice(item)
          const baseUrl = import.meta.env.VITE_API_URL || ''
          const img = item.product.mainImageUrl
            ? `${baseUrl}${item.product.mainImageUrl}`
            : 'https://placehold.co/100x120/F2C4D0/2B2B2B?text=G%26G'

          return (
            <div
              key={`${item.product.id}-${item.color}-${item.size}`}
              className="flex gap-4 rounded-2xl border border-gray-100 p-4"
            >
              <img src={img} alt="" className="h-28 w-20 rounded-lg object-cover" />
              <div className="flex-1">
                <h3 className="font-serif text-lg">{item.product.title}</h3>
                <p className="text-sm text-brand-muted">
                  {item.color} · Tamanho {item.size}
                </p>
                <p className="mt-1 font-semibold">
                  {price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.product.id, item.color, item.size, Number(e.target.value))
                    }
                    className="input-field max-w-[80px] py-1"
                  />
                  <button
                    onClick={() => removeItem(item.product.id, item.color, item.size)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <p className="font-semibold">
                {(price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex flex-col items-end gap-4 border-t border-gray-100 pt-6">
        <p className="text-xl font-semibold">
          Total: {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <div className="flex gap-3">
          <button onClick={clearCart} className="btn-outline">
            Limpar carrinho
          </button>
          <Link to="/checkout" className="btn-primary">
            Finalizar compra
          </Link>
        </div>
      </div>
    </div>
  )
}
