import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { extractApiError, resolveImageUrl, ImageUploadBox } from './productFormUtils'
import { pageContent } from '../../utils/page'

const emptyColor = () => ({ name: '', hexCode: '#000000' })

/** Normaliza HEX para o input type=color (#rrggbb). */
function normalizeHex(value, fallback = '#000000') {
  if (!value) return fallback
  let v = String(value).trim()
  if (!v.startsWith('#')) v = `#${v}`
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toLowerCase()
  return fallback
}
const emptySpec = () => ({ key: '', value: '' })

const defaultForm = {
  title: '',
  description: '',
  categoryId: '',
  price: '',
  wholesalePrice: '',
  active: true,
  sizesInput: '40-48',
  colors: [emptyColor()],
  specifications: [],
  stock: [],
}

function parseSizes(input) {
  return input.split(',').map((s) => s.trim()).filter(Boolean)
}

function buildStockMatrix(colors, sizes, existingStock = []) {
  const stockMap = new Map(
    existingStock.map((s) => [`${s.colorName}::${s.sizeName}`, s.quantity ?? 0]),
  )
  const rows = []
  colors.forEach((color) => {
    sizes.forEach((size) => {
      rows.push({
        colorName: color.name,
        sizeName: size,
        quantity: stockMap.get(`${color.name}::${size}`) ?? 0,
      })
    })
  })
  return rows
}

function productToForm(product) {
  if (!product) return defaultForm
  return {
    title: product.title || '',
    description: product.description || '',
    categoryId: String(product.categoryId || ''),
    price: String(product.price ?? ''),
    wholesalePrice: String(product.wholesalePrice ?? ''),
    active: product.active !== false,
    sizesInput: (product.sizes || []).join(', '),
    colors: product.colors?.length
      ? product.colors.map((c) => ({ name: c.name, hexCode: c.hexCode || '#000000' }))
      : [emptyColor()],
    specifications: product.specifications?.length
      ? product.specifications.map((s) => {
          const [key, value] = Object.entries(s)[0] || ['', '']
          return { key, value }
        })
      : [],
    stock: product.stock?.length
      ? product.stock.map((s) => ({
          colorName: s.colorName,
          sizeName: s.sizeName,
          quantity: s.quantity ?? 0,
        }))
      : [],
  }
}

export function ProductForm({ product, onSaved, onCancel }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(defaultForm)
  const [savedProduct, setSavedProduct] = useState(product || null)
  const [mainImageFile, setMainImageFile] = useState(null)
  const [mainPreview, setMainPreview] = useState(null)
  const [gallerySlots, setGallerySlots] = useState([{ id: 1, file: null, preview: null }])
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingGalleryIndex, setUploadingGalleryIndex] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentProduct = savedProduct || product

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/api/categories?size=100&sort=name,asc')).data,
  })

  const categories = pageContent(categoriesData)
  const selectableCategories = categories.filter((c) => c.slug !== 'sem-categoria')

  useEffect(() => {
    if (product) return
    if (!form.categoryId) return
    const cat = selectableCategories.find((c) => String(c.id) === String(form.categoryId))
    const options = cat?.sizeOptions
    if (!options?.length) return
    const nextSizes = options.join(', ')
    setForm((prev) => {
      if (prev.sizesInput === nextSizes) return prev
      return { ...prev, sizesInput: nextSizes, stock: [] }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to category change
  }, [form.categoryId, product, categoriesData])

  useEffect(() => {
    setSavedProduct(product || null)
    setForm(productToForm(product))
    setMainImageFile(null)
    setMainPreview(null)
    setError('')
    setSuccess('')

    if (product?.galleryImages?.length) {
      setGallerySlots(
        product.galleryImages.map((url, i) => ({
          id: i + 1,
          file: null,
          preview: resolveImageUrl(url),
          existingUrl: url,
        })),
      )
    } else {
      setGallerySlots([{ id: 1, file: null, preview: null }])
    }
  }, [product])

  const uploadMainImage = async (productId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post(`/api/products/${productId}/image/main`, formData)
    return data
  }

  const uploadGalleryImage = async (productId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post(`/api/products/${productId}/image/gallery`, formData)
    return data
  }

  const refreshProduct = async (productId) => {
    const { data } = await api.get(`/api/products/${productId}`)
    setSavedProduct(data)
    return data
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const colors = form.colors.filter((c) => c.name.trim())
      const uniqueColors = []
      const seenColors = new Set()
      for (const color of colors) {
        const name = color.name.trim()
        const key = name.toLowerCase()
        if (seenColors.has(key)) continue
        seenColors.add(key)
        uniqueColors.push({ ...color, name })
      }
      const sizes = parseSizes(form.sizesInput)

      if (!form.title.trim()) throw new Error('Informe o título do produto.')
      if (!form.categoryId) throw new Error('Selecione uma categoria.')
      if (!form.price || !form.wholesalePrice) throw new Error('Informe preço e preço atacado.')
      if (uniqueColors.length === 0) throw new Error('Adicione pelo menos uma cor.')
      if (sizes.length === 0) throw new Error('Informe pelo menos um tamanho.')

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: Number(form.categoryId),
        price: Number(form.price),
        wholesalePrice: Number(form.wholesalePrice),
        active: form.active,
        colors: uniqueColors.map((c) => ({
          name: c.name.trim(),
          hexCode: normalizeHex(c.hexCode, null) || null,
        })),
        sizes,
        specifications: form.specifications
          .filter((s) => s.key.trim() && s.value.trim())
          .map((s) => ({ key: s.key.trim(), value: s.value.trim() })),
        stock: form.stock
          .filter((s) => s.colorName && s.sizeName)
          .map((s) => ({
            colorName: s.colorName,
            sizeName: s.sizeName,
            quantity: Number(s.quantity) || 0,
          })),
      }

      if (currentProduct?.id) {
        return (await api.put(`/api/products/${currentProduct.id}`, payload)).data
      }
      return (await api.post('/api/products', payload)).data
    },
    onSuccess: async (data) => {
      setError('')
      let updated = data

      try {
        if (mainImageFile) {
          updated = await uploadMainImage(data.id, mainImageFile)
          setMainImageFile(null)
          setMainPreview(null)
        }

        const pendingGallery = gallerySlots.filter((s) => s.file)
        for (const slot of pendingGallery) {
          updated = await uploadGalleryImage(data.id, slot.file)
        }

        updated = await refreshProduct(updated.id)
      } catch (uploadErr) {
        setSuccess('Produto salvo, mas houve erro ao enviar alguma imagem. Tente o upload novamente.')
        setSavedProduct(data)
        queryClient.invalidateQueries({ queryKey: ['admin-products'] })
        onSaved?.(data)
        return
      }

      setSavedProduct(updated)
      setSuccess(currentProduct?.id ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!')

      if (updated.galleryImages?.length) {
        setGallerySlots(
          updated.galleryImages.map((url, i) => ({
            id: i + 1,
            file: null,
            preview: resolveImageUrl(url),
            existingUrl: url,
          })),
        )
      }

      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSaved?.(updated)
    },
    onError: (err) => {
      setSuccess('')
      setError(extractApiError(err))
    },
  })

  const handleMainUpload = async (file) => {
    setMainImageFile(file)
    setMainPreview(URL.createObjectURL(file))

    if (currentProduct?.id) {
      try {
        setUploadingMain(true)
        const updated = await uploadMainImage(currentProduct.id, file)
        setSavedProduct(updated)
        setMainImageFile(null)
        setSuccess('Imagem principal atualizada!')
      } catch (err) {
        setError(extractApiError(err))
      } finally {
        setUploadingMain(false)
      }
    }
  }

  const handleGalleryUpload = async (index, file) => {
    const preview = URL.createObjectURL(file)
    setGallerySlots((slots) =>
      slots.map((s, i) => (i === index ? { ...s, file, preview } : s)),
    )

    if (currentProduct?.id) {
      try {
        setUploadingGalleryIndex(index)
        const updated = await uploadGalleryImage(currentProduct.id, file)
        setSavedProduct(updated)
        setGallerySlots(
          updated.galleryImages.map((url, i) => ({
            id: i + 1,
            file: null,
            preview: resolveImageUrl(url),
            existingUrl: url,
          })),
        )
        setSuccess('Imagem do carrossel adicionada!')
        queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      } catch (err) {
        setError(extractApiError(err))
      } finally {
        setUploadingGalleryIndex(null)
      }
    }
  }

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const updateListItem = (list, index, field, value) => {
    setForm((prev) => ({
      ...prev,
      [list]: prev[list].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addListItem = (list, factory) => {
    setForm((prev) => ({ ...prev, [list]: [...prev[list], factory()] }))
  }

  const removeListItem = (list, index) => {
    setForm((prev) => ({ ...prev, [list]: prev[list].filter((_, i) => i !== index) }))
  }

  const generateStock = () => {
    const colors = form.colors.filter((c) => c.name.trim())
    const sizes = parseSizes(form.sizesInput)
    if (!colors.length || !sizes.length) {
      setError('Defina cores e tamanhos antes de gerar o estoque.')
      return
    }
    setError('')
    updateField('stock', buildStockMatrix(colors, sizes, form.stock))
  }

  const mainDisplayUrl =
    mainPreview || resolveImageUrl(currentProduct?.mainImageUrl) || null

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSuccess('')
        saveMutation.mutate()
      }}
      className="admin-card"
    >
      <h2 className="font-display text-xl font-semibold text-neon-text">
        {currentProduct?.id ? 'Editar produto' : 'Cadastrar produto'}
      </h2>

      {error && (
        <div className="mt-4 admin-alert-err">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 admin-alert-ok">
          {success}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label-field">Título *</label>
          <input
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Ex.: Vestido longo floral"
            className="admin-input"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-field">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={4}
            placeholder="Descreva o produto..."
            className="admin-input rounded-xl"
          />
        </div>

        <div>
          <label className="label-field">Categoria *</label>
          <select
            value={form.categoryId}
            onChange={(e) => updateField('categoryId', e.target.value)}
            className="admin-input"
          >
            <option value="">Selecione...</option>
            {selectableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {selectableCategories.length === 0 && (
            <p className="mt-1 text-xs text-red-500">
              Cadastre uma categoria em &quot;Categorias&quot; antes de adicionar produtos.
            </p>
          )}
        </div>

        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => updateField('active', e.target.checked)}
              className="h-4 w-4 rounded border-neon-line/15"
            />
            Produto ativo na loja
          </label>
        </div>

        <div>
          <label className="label-field">Preço varejo (R$) *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => updateField('price', e.target.value)}
            className="admin-input"
          />
        </div>

        <div>
          <label className="label-field">Preço atacado (R$) *</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.wholesalePrice}
            onChange={(e) => updateField('wholesalePrice', e.target.value)}
            className="admin-input"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-field">Tamanhos *</label>
          <input
            value={form.sizesInput}
            onChange={(e) => updateField('sizesInput', e.target.value)}
            placeholder="40-48 (separados por vírgula)"
            className="admin-input"
          />
          <p className="mt-1 text-xs text-brand-muted">
            Prefira os tamanhos da categoria (ex.: 40-48). Eles são preenchidos ao escolher a categoria.
          </p>
        </div>
      </div>

      {/* Imagens — estilo referência */}
      <div className="mt-8 space-y-6">
        <ImageUploadBox
          label="Imagem principal (home)"
          previewUrl={mainDisplayUrl}
          fileName={mainImageFile?.name || currentProduct?.mainImageUrl?.split('/').pop()}
          onUpload={handleMainUpload}
          uploading={uploadingMain}
        />

        <fieldset className="admin-fieldset">
          <legend className="px-1 text-sm font-semibold text-neon-text">
            Imagens do carrossel (detalhe do produto)
          </legend>

          <div className="mt-3 space-y-4">
            {gallerySlots.map((slot, index) => (
              <div key={slot.id} className="rounded-lg border border-gray-200 bg-neon-card/40/50 p-3">
                <p className="mb-2 text-xs font-medium text-brand-muted">Imagem {index + 1}</p>
                <ImageUploadBox
                  compact
                  previewUrl={slot.preview}
                  fileName={slot.file?.name || slot.existingUrl?.split('/').pop()}
                  onUpload={(file) => handleGalleryUpload(index, file)}
                  uploading={uploadingGalleryIndex === index}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setGallerySlots((slots) => [
                ...slots,
                { id: Date.now(), file: null, preview: null },
              ])
            }
            className="mt-4 w-full rounded-lg border border-dashed border-neon-line/15 bg-neon-card/40 py-3 text-sm font-medium text-neon-text transition hover:border-brand-pink hover:bg-brand-pink/20"
          >
            + Adicionar imagem ao carrossel
          </button>
        </fieldset>

        {!currentProduct?.id && (
          <p className="text-xs text-brand-muted">
            Dica: salve o produto primeiro. As imagens selecionadas serão enviadas automaticamente ao clicar em
            &quot;Cadastrar produto&quot;.
          </p>
        )}
      </div>

      {/* Cores */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neon-text">Cores *</h3>
          <button
            type="button"
            onClick={() => addListItem('colors', emptyColor)}
            className="text-sm font-medium text-brand-purple hover:underline"
          >
            + Adicionar cor
          </button>
        </div>
        <p className="mt-1 text-xs text-neon-muted">
          Use a paleta para escolher a cor — o código HEX é preenchido automaticamente.
        </p>
        <div className="mt-3 space-y-2">
          {form.colors.map((color, index) => {
            const pickerValue = normalizeHex(color.hexCode)
            return (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <input
                  value={color.name}
                  onChange={(e) => updateListItem('colors', index, 'name', e.target.value)}
                  placeholder="Nome da cor (ex.: Preto)"
                  className="admin-input min-w-[140px] flex-1"
                />
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-neon-line/15 bg-neon-card/40 px-2 py-1.5"
                  title="Abrir paleta de cores"
                >
                  <span
                    className="h-7 w-7 shrink-0 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: pickerValue }}
                    aria-hidden
                  />
                  <input
                    type="color"
                    value={pickerValue}
                    onChange={(e) => updateListItem('colors', index, 'hexCode', e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label={`Paleta da cor ${color.name || index + 1}`}
                  />
                </label>
                <input
                  value={color.hexCode}
                  onChange={(e) => updateListItem('colors', index, 'hexCode', e.target.value)}
                  placeholder="#000000"
                  className="admin-input w-32 font-mono text-sm"
                  spellCheck={false}
                />
                {form.colors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeListItem('colors', index)}
                    className="rounded-lg border border-red-200 px-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    Remover
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Especificações */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neon-text">Especificações</h3>
          <button
            type="button"
            onClick={() => addListItem('specifications', emptySpec)}
            className="text-sm font-medium text-brand-purple hover:underline"
          >
            + Adicionar
          </button>
        </div>
        {form.specifications.length === 0 ? (
          <p className="mt-2 text-sm text-brand-muted">Opcional — ex.: Tecido, Comprimento...</p>
        ) : (
          <div className="mt-3 space-y-2">
            {form.specifications.map((spec, index) => (
              <div key={index} className="flex flex-wrap gap-2">
                <input
                  value={spec.key}
                  onChange={(e) => updateListItem('specifications', index, 'key', e.target.value)}
                  placeholder="Campo"
                  className="admin-input min-w-[120px] flex-1"
                />
                <input
                  value={spec.value}
                  onChange={(e) => updateListItem('specifications', index, 'value', e.target.value)}
                  placeholder="Valor"
                  className="admin-input min-w-[120px] flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeListItem('specifications', index)}
                  className="rounded-lg border border-red-200 px-3 text-sm text-red-500 hover:bg-red-50"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estoque */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-neon-text">Estoque</h3>
          <button
            type="button"
            onClick={generateStock}
            className="rounded-lg border border-brand-pink-dark bg-brand-pink/40 px-4 py-2 text-sm font-medium hover:bg-brand-pink"
          >
            Gerar grade cor × tamanho
          </button>
        </div>

        {form.stock.length === 0 ? (
          <p className="mt-2 text-sm text-brand-muted">
            Clique em &quot;Gerar grade&quot; após definir cores e tamanhos.
          </p>
        ) : (
          <div className="admin-table-wrap mt-3">
            <table className="admin-table">
              <thead className="bg-transparent">
                <tr>
                  <th className="px-3 py-2">Cor</th>
                  <th className="px-3 py-2">Tamanho</th>
                  <th className="px-3 py-2">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {form.stock.map((row, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="px-3 py-2">{row.colorName}</td>
                    <td className="px-3 py-2">{row.sizeName}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={row.quantity}
                        onChange={(e) => updateListItem('stock', index, 'quantity', e.target.value)}
                        className="admin-input w-24 py-1.5"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="submit" disabled={saveMutation.isPending} className="btn-primary">
          {saveMutation.isPending
            ? 'Salvando...'
            : currentProduct?.id
              ? 'Salvar produto'
              : 'Cadastrar produto'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-outline">
            {currentProduct?.id ? 'Fechar' : 'Cancelar'}
          </button>
        )}
      </div>
    </form>
  )
}
