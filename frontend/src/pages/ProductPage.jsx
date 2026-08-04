import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { useCartStore } from '../store/cartStore'
import { useUiStore } from '../store/uiStore'

export default function ProductPage() {
  const { id } = useParams()
  const addItem = useCartStore((s) => s.addItem)
  const showToast = useUiStore((s) => s.showToast)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/api/products/${id}`)).data,
    // Estoque muda com compras — não usar cache longo
    staleTime: 15_000,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  })

  if (isLoading) return <p className="p-10 text-center">Carregando...</p>
  if (!product) return <p className="p-10 text-center">Produto não encontrado.</p>

  const baseUrl = import.meta.env.VITE_API_URL || ''
  const allUrls = [product.mainImageUrl, ...(product.galleryImages || [])].filter(Boolean)
  const images = allUrls.length > 0
    ? allUrls.map((url) => `${baseUrl}${url}`)
    : ['https://placehold.co/600x800/F2C4D0/2B2B2B?text=GIG']

  const stockForSelection = product.stock?.find(
    (s) => s.colorName === selectedColor && s.sizeName === selectedSize,
  )
  const availableQty = stockForSelection?.quantity ?? 0
  const hasMultipleImages = images.length > 1

  const goPrev = () => {
    setActiveImage((current) => (current - 1 + images.length) % images.length)
  }

  const goNext = () => {
    setActiveImage((current) => (current + 1) % images.length)
  }

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setZoomOrigin({ x, y })
  }

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      showToast({
        type: 'warn',
        title: 'Quase lá',
        message: 'Selecione a cor e o tamanho para continuar.',
        durationMs: 3500,
      })
      return
    }
    if (availableQty < quantity) {
      showToast({
        type: 'error',
        title: 'Estoque insuficiente',
        message: 'A quantidade pedida não está disponível neste momento.',
        durationMs: 4000,
      })
      return
    }
    addItem(product, selectedColor, selectedSize, quantity)
    showToast({
      type: 'success',
      title: 'Adicionado ao carrinho',
      message: `${product.title} · ${selectedColor} / ${selectedSize}`,
      actionLabel: 'Ver carrinho',
      actionTo: '/carrinho',
      durationMs: 4500,
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="w-full">
          <div
            className="group relative mx-auto h-[min(62vh,560px)] w-full overflow-hidden rounded-2xl bg-brand-pink/20"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={images[activeImage]}
              alt={product.title}
              className="h-full w-full object-contain transition-transform duration-150 ease-out will-change-transform"
              style={{
                transform: isHovering ? 'scale(2)' : 'scale(1)',
                transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                cursor: isHovering ? 'crosshair' : 'zoom-in',
              }}
              draggable={false}
            />

            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Imagem anterior"
                  className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-brand-charcoal shadow-md transition hover:bg-white"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Próxima imagem"
                  className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-brand-charcoal shadow-md transition hover:bg-white"
                >
                  ›
                </button>
              </>
            )}

            {hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/45 px-2.5 py-0.5 text-xs text-white">
                {activeImage + 1} / {images.length}
              </div>
            )}
          </div>

          {hasMultipleImages && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    activeImage === idx ? 'border-brand-purple' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-muted">
            {product.categoryName}
          </p>
          <h1 className="mt-2 font-sans text-2xl font-medium leading-snug tracking-wide text-brand-charcoal sm:text-3xl">
            {product.title}
          </h1>
          <p className="mt-4 font-sans text-3xl font-bold tracking-tight text-brand-charcoal">
            {Number(product.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="mt-1 font-sans text-sm font-normal text-brand-muted">
            ou 4x de{' '}
            <span className="font-bold text-brand-charcoal">
              {(Number(product.price) / 4).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>{' '}
            Sem juros
          </p>
          {product.wholesalePrice && (
            <p className="mt-2 text-sm text-brand-muted">
              Atacado (4+ peças):{' '}
              {Number(product.wholesalePrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          )}

          <p className="mt-6 leading-relaxed text-brand-muted">{product.description}</p>

          {product.specifications?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-serif text-lg font-semibold">Especificações</h3>
              <dl className="mt-3 space-y-2">
                {product.specifications.map((spec, i) => {
                  const [key, value] = Object.entries(spec)[0]
                  return (
                    <div key={i} className="flex justify-between border-b border-gray-100 py-2 text-sm">
                      <dt className="font-medium">{key}</dt>
                      <dd className="text-brand-muted">{value}</dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          )}

          <div className="mt-8">
            <label className="label-field">Cor</label>
            <div className="flex flex-wrap gap-2">
              {product.colors?.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.name)}
                  className={`rounded-full border px-4 py-2 text-sm ${selectedColor === color.name ? 'border-brand-purple bg-brand-purple text-white' : 'border-gray-200'}`}
                  style={color.hexCode ? { borderColor: color.hexCode } : {}}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="label-field">Tamanho</label>
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full border px-4 py-2 text-sm ${selectedSize === size ? 'border-brand-purple bg-brand-purple text-white' : 'border-gray-200'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {selectedColor && selectedSize && (
            <p className="mt-2 text-sm text-brand-muted">
              {availableQty > 0 ? `${availableQty} unidade(s) disponível(is)` : 'Indisponível'}
            </p>
          )}

          <div className="mt-6">
            <label className="label-field">Quantidade</label>
            <input
              type="number"
              min={1}
              max={availableQty || 99}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input-field max-w-[120px]"
            />
          </div>

          <button onClick={handleAddToCart} className="btn-primary mt-8 w-full sm:w-auto">
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  )
}
