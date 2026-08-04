import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../api/client'
import { extractApiError } from '../../components/admin/productFormUtils'
import { Hero } from '../../components/hero/Hero'
import { HERO_ICON_OPTIONS, HeroFeatureIcon } from '../../components/hero/HeroIcons'
import { DEFAULT_HERO, mergeHeroConfig, resolveHeroMediaUrl } from '../../components/hero/heroDefaults'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

function toFormValues(hero) {
  const h = mergeHeroConfig(hero)
  return {
    titleLine1: h.titleLine1 || '',
    titleLine2: h.titleLine2 || '',
    titleLine2Color: h.titleLine2Color || '#9B8FD9',
    titleFontWeight: h.titleFontWeight || 'bold',
    titleFontSize: h.titleFontSize || 'md',
    description: h.description || '',
    buttonText: h.buttonText || '',
    buttonLink: h.buttonLink || '',
    buttonBackground: h.buttonBackground || '#E8A8B8',
    buttonTextColor: h.buttonTextColor || '#2B2B2B',
    buttonBorderRadius: h.buttonBorderRadius || 'full',
    buttonVisible: h.buttonVisible !== false,
    buttonHoverBackground: h.buttonHoverBackground || '#E0A4AE',
    secondaryButton1Text: h.secondaryButton1Text || '',
    secondaryButton1Url: h.secondaryButton1Url || '',
    secondaryButton1Color: h.secondaryButton1Color || '#9B8FD9',
    secondaryButton1Visible: !!h.secondaryButton1Visible,
    secondaryButton2Text: h.secondaryButton2Text || '',
    secondaryButton2Url: h.secondaryButton2Url || '',
    secondaryButton2Color: h.secondaryButton2Color || '#9B8FD9',
    secondaryButton2Visible: !!h.secondaryButton2Visible,
    backgroundType: h.backgroundType || 'gradient',
    backgroundColor: h.backgroundColor || '#FBF3F5',
    backgroundGradient: h.backgroundGradient || DEFAULT_HERO.backgroundGradient,
    overlayColor: h.overlayColor || '#000000',
    overlayOpacity: Number(h.overlayOpacity ?? 0),
    textAlignment: h.textAlignment || 'center',
    heroHeight: h.heroHeight || 'medium',
    imagePosition: h.imagePosition || 'right',
  }
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-neon-muted">{label}</span>
      {children}
    </label>
  )
}

function ColorField({ label, register, name }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" className="h-10 w-12 cursor-pointer rounded border border-neon-line/15 bg-transparent p-1" {...register(name)} />
        <input className="admin-input flex-1" {...register(name)} />
      </div>
    </Field>
  )
}

export default function AdminHeroSection() {
  const queryClient = useQueryClient()
  const showToast = useUiStore((s) => s.showToast)
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN')
  const [features, setFeatures] = useState([])
  const [heroImageUrl, setHeroImageUrl] = useState(DEFAULT_HERO.heroImageUrl)
  const [logoImageUrl, setLogoImageUrl] = useState(null)
  const [uploading, setUploading] = useState(null)
  const [newFeature, setNewFeature] = useState({ icon: 'heart', title: '' })

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm({
    defaultValues: toFormValues(DEFAULT_HERO),
  })
  const watched = useWatch({ control })

  const { data, isLoading } = useQuery({
    queryKey: ['cms-hero'],
    queryFn: async () => (await api.get('/api/cms/hero')).data,
  })

  useEffect(() => {
    if (!data) return
    const merged = mergeHeroConfig(data)
    reset(toFormValues(merged))
    setFeatures(merged.features || [])
    setHeroImageUrl(merged.heroImageUrl)
    setLogoImageUrl(merged.logoImageUrl)
  }, [data, reset])

  const previewConfig = useMemo(
    () => ({
      ...DEFAULT_HERO,
      ...watched,
      heroImageUrl,
      logoImageUrl,
      features,
      buttonVisible: !!watched.buttonVisible,
      secondaryButton1Visible: !!watched.secondaryButton1Visible,
      secondaryButton2Visible: !!watched.secondaryButton2Visible,
      overlayOpacity: Number(watched.overlayOpacity ?? 0),
    }),
    [watched, heroImageUrl, logoImageUrl, features],
  )

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const payload = {
        ...formData,
        buttonVisible: !!formData.buttonVisible,
        secondaryButton1Visible: !!formData.secondaryButton1Visible,
        secondaryButton2Visible: !!formData.secondaryButton2Visible,
        overlayOpacity: Number(formData.overlayOpacity ?? 0),
        heroImageUrl,
        logoImageUrl: logoImageUrl || '',
        features: features.map((f, i) => ({
          icon: f.icon,
          title: f.title,
          displayOrder: i,
        })),
      }
      return (await api.put('/api/cms/hero', payload)).data
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(['cms-hero'], saved)
      showToast({ type: 'success', title: 'Hero salva', message: 'Alterações publicadas na loja.' })
    },
    onError: (err) => {
      showToast({ type: 'error', title: 'Erro ao salvar', message: extractApiError(err) })
    },
  })

  const resetMutation = useMutation({
    mutationFn: async () => (await api.post('/api/cms/hero/reset')).data,
    onSuccess: (saved) => {
      queryClient.setQueryData(['cms-hero'], saved)
      showToast({ type: 'success', title: 'Padrão restaurado', message: 'Hero voltou ao visual original.' })
    },
    onError: (err) => {
      showToast({ type: 'error', title: 'Erro', message: extractApiError(err) })
    },
  })

  const uploadFile = async (kind, file) => {
    if (!file) return
    setUploading(kind)
    try {
      const form = new FormData()
      form.append('file', file)
      const endpoint = kind === 'logo' ? '/api/cms/hero/logo' : '/api/cms/hero/image'
      const saved = (await api.post(endpoint, form)).data
      queryClient.setQueryData(['cms-hero'], saved)
      if (kind === 'logo') setLogoImageUrl(saved.logoImageUrl)
      else setHeroImageUrl(saved.heroImageUrl)
      showToast({ type: 'success', message: 'Imagem enviada.' })
    } catch (err) {
      showToast({ type: 'error', title: 'Upload falhou', message: extractApiError(err) })
    } finally {
      setUploading(null)
    }
  }

  const removeImage = async (kind) => {
    setUploading(kind)
    try {
      const endpoint = kind === 'logo' ? '/api/cms/hero/logo' : '/api/cms/hero/image'
      const saved = (await api.delete(endpoint)).data
      queryClient.setQueryData(['cms-hero'], saved)
      if (kind === 'logo') setLogoImageUrl(saved.logoImageUrl)
      else setHeroImageUrl(saved.heroImageUrl)
      showToast({ type: 'success', message: kind === 'logo' ? 'Logo removida.' : 'Imagem restaurada ao padrão.' })
    } catch (err) {
      showToast({ type: 'error', message: extractApiError(err) })
    } finally {
      setUploading(null)
    }
  }

  const moveFeature = (index, dir) => {
    setFeatures((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const addFeatureLocal = () => {
    const title = newFeature.title.trim()
    if (!title) {
      showToast({ type: 'error', message: 'Informe o título do badge.' })
      return
    }
    setFeatures((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, icon: newFeature.icon, title, displayOrder: prev.length },
    ])
    setNewFeature({ icon: 'heart', title: '' })
  }

  const onSubmit = (formData) => saveMutation.mutate(formData)

  if (isLoading && !data) {
    return <p className="text-sm text-neon-muted">Carregando Hero…</p>
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="admin-page-title">Hero Section</h1>
          <p className="admin-page-sub">Edite a capa da Home. O preview ao lado atualiza em tempo real.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              type="button"
              className="rounded-xl border border-neon-line/20 px-4 py-2.5 text-sm font-medium text-neon-muted transition hover:border-brand-pink/40 hover:text-neon-text disabled:opacity-50"
              disabled={resetMutation.isPending}
              onClick={() => {
                if (window.confirm('Restaurar o visual padrão da Hero?')) {
                  resetMutation.mutate()
                }
              }}
            >
              {resetMutation.isPending ? 'Restaurando…' : 'Restaurar padrão'}
            </button>
          )}
          <button
            type="submit"
            form="hero-cms-form"
            className="rounded-xl bg-brand-pink px-5 py-2.5 text-sm font-semibold text-brand-charcoal shadow-neon transition hover:bg-brand-pink-dark disabled:opacity-50 dark:text-neon-bg"
            disabled={isSubmitting || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Salvando…' : 'Salvar Hero'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form id="hero-cms-form" onSubmit={handleSubmit(onSubmit)} className="admin-card space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neon-text">Textos</h2>
            <Field label="Título (linha 1)">
              <input className="admin-input" {...register('titleLine1', { required: true })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Título (linha 2 — itálico)">
                <input className="admin-input" {...register('titleLine2')} />
              </Field>
              <ColorField label="Cor da linha 2" register={register} name="titleLine2Color" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Peso do título">
                <select className="admin-input" {...register('titleFontWeight')}>
                  <option value="normal">Normal</option>
                  <option value="semibold">Semibold</option>
                  <option value="bold">Bold</option>
                </select>
              </Field>
              <Field label="Tamanho do título">
                <select className="admin-input" {...register('titleFontSize')}>
                  <option value="sm">Pequeno</option>
                  <option value="md">Médio</option>
                  <option value="lg">Grande</option>
                </select>
              </Field>
            </div>
            <Field label="Descrição">
              <textarea className="admin-input min-h-[88px] resize-y" {...register('description')} />
            </Field>
          </section>

          <section className="space-y-3 border-t border-neon-line/10 pt-5">
            <h2 className="text-sm font-semibold text-neon-text">Botão principal</h2>
            <label className="flex items-center gap-2 text-sm text-neon-muted">
              <input type="checkbox" {...register('buttonVisible')} />
              Visível
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Texto">
                <input className="admin-input" {...register('buttonText')} />
              </Field>
              <Field label="Link">
                <input className="admin-input" placeholder="#colecao ou /categoria/1" {...register('buttonLink')} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField label="Fundo" register={register} name="buttonBackground" />
              <ColorField label="Texto" register={register} name="buttonTextColor" />
              <ColorField label="Hover" register={register} name="buttonHoverBackground" />
              <Field label="Bordas">
                <select className="admin-input" {...register('buttonBorderRadius')}>
                  <option value="none">Reto</option>
                  <option value="md">Médio</option>
                  <option value="lg">Grande</option>
                  <option value="full">Pílula</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="space-y-3 border-t border-neon-line/10 pt-5">
            <h2 className="text-sm font-semibold text-neon-text">Botões secundários</h2>
            {[1, 2].map((n) => (
              <div key={n} className="space-y-2 rounded-xl border border-neon-line/10 p-3">
                <label className="flex items-center gap-2 text-sm text-neon-muted">
                  <input type="checkbox" {...register(`secondaryButton${n}Visible`)} />
                  Botão {n} visível
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Texto">
                    <input className="admin-input" {...register(`secondaryButton${n}Text`)} />
                  </Field>
                  <Field label="URL">
                    <input className="admin-input" {...register(`secondaryButton${n}Url`)} />
                  </Field>
                  <ColorField label="Cor" register={register} name={`secondaryButton${n}Color`} />
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3 border-t border-neon-line/10 pt-5">
            <h2 className="text-sm font-semibold text-neon-text">Layout e fundo</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Alinhamento do texto">
                <select className="admin-input" {...register('textAlignment')}>
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </Field>
              <Field label="Altura">
                <select className="admin-input" {...register('heroHeight')}>
                  <option value="small">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="large">Alta</option>
                </select>
              </Field>
              <Field label="Posição da imagem">
                <select className="admin-input" {...register('imagePosition')}>
                  <option value="left">Esquerda</option>
                  <option value="right">Direita</option>
                  <option value="center">Centro (tela cheia)</option>
                </select>
              </Field>
              <Field label="Tipo de fundo">
                <select className="admin-input" {...register('backgroundType')}>
                  <option value="gradient">Gradiente (classes Tailwind)</option>
                  <option value="color">Cor sólida</option>
                </select>
              </Field>
            </div>
            {watched.backgroundType === 'color' ? (
              <ColorField label="Cor de fundo" register={register} name="backgroundColor" />
            ) : (
              <Field label="Classes do gradiente">
                <input className="admin-input font-mono text-xs" {...register('backgroundGradient')} />
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField label="Overlay" register={register} name="overlayColor" />
              <Field label={`Opacidade overlay (${watched.overlayOpacity ?? 0})`}>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.05"
                  className="w-full"
                  {...register('overlayOpacity')}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3 border-t border-neon-line/10 pt-5">
            <h2 className="text-sm font-semibold text-neon-text">Imagens</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-neon-muted">Imagem principal</p>
                <div className="overflow-hidden rounded-xl border border-neon-line/15 bg-neon-card/40">
                  <img
                    src={resolveHeroMediaUrl(heroImageUrl) || '/images/hero-boutique.png'}
                    alt="Hero"
                    className="h-36 w-full object-cover"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-xl border border-neon-line/15 px-3 py-2 text-xs font-medium hover:bg-brand-pink/20">
                    {uploading === 'main' ? 'Enviando…' : 'Trocar'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={!!uploading}
                      onChange={(e) => uploadFile('main', e.target.files?.[0])}
                    />
                  </label>
                  <button
                    type="button"
                    className="rounded-xl border border-neon-line/15 px-3 py-2 text-xs text-neon-muted hover:text-neon-text"
                    disabled={!!uploading}
                    onClick={() => removeImage('main')}
                  >
                    Restaurar padrão
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-neon-muted">Logo (opcional)</p>
                <div className="flex h-36 items-center justify-center overflow-hidden rounded-xl border border-neon-line/15 bg-neon-card/40">
                  {logoImageUrl ? (
                    <img src={resolveHeroMediaUrl(logoImageUrl)} alt="Logo" className="max-h-full max-w-full object-contain p-4" />
                  ) : (
                    <span className="text-xs text-neon-muted">Usa marca GIG padrão</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-xl border border-neon-line/15 px-3 py-2 text-xs font-medium hover:bg-brand-pink/20">
                    {uploading === 'logo' ? 'Enviando…' : 'Enviar logo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={!!uploading}
                      onChange={(e) => uploadFile('logo', e.target.files?.[0])}
                    />
                  </label>
                  {logoImageUrl && (
                    <button
                      type="button"
                      className="rounded-xl border border-neon-line/15 px-3 py-2 text-xs text-neon-muted hover:text-neon-text"
                      disabled={!!uploading}
                      onClick={() => removeImage('logo')}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 border-t border-neon-line/10 pt-5">
            <h2 className="text-sm font-semibold text-neon-text">Badges (features)</h2>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li
                  key={feature.id ?? `${feature.icon}-${index}`}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-neon-line/10 bg-neon-card/30 p-2"
                >
                  <span className="text-brand-pink">
                    <HeroFeatureIcon icon={feature.icon} className="h-4 w-4" />
                  </span>
                  <select
                    className="admin-input w-28 py-1.5 text-xs"
                    value={feature.icon}
                    onChange={(e) => {
                      const icon = e.target.value
                      setFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, icon } : f)))
                    }}
                  >
                    {HERO_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="admin-input min-w-[140px] flex-1 py-1.5 text-xs"
                    value={feature.title}
                    onChange={(e) => {
                      const title = e.target.value
                      setFeatures((prev) => prev.map((f, i) => (i === index ? { ...f, title } : f)))
                    }}
                  />
                  <div className="flex gap-1">
                    <button type="button" className="rounded-lg px-2 py-1 text-xs hover:bg-white/10" onClick={() => moveFeature(index, -1)}>
                      ↑
                    </button>
                    <button type="button" className="rounded-lg px-2 py-1 text-xs hover:bg-white/10" onClick={() => moveFeature(index, 1)}>
                      ↓
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                      onClick={() => setFeatures((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Ícone">
                <select
                  className="admin-input"
                  value={newFeature.icon}
                  onChange={(e) => setNewFeature((p) => ({ ...p, icon: e.target.value }))}
                >
                  {HERO_ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Título">
                <input
                  className="admin-input"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Novo badge"
                />
              </Field>
              <button
                type="button"
                onClick={addFeatureLocal}
                className="rounded-xl border border-neon-line/15 px-4 py-2.5 text-sm font-medium hover:bg-brand-pink/20"
              >
                Adicionar
              </button>
            </div>
          </section>
        </form>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neon-muted">Preview ao vivo</p>
          <div className="overflow-hidden rounded-2xl border border-neon-line/15 shadow-neon">
            <div className="origin-top scale-[0.92] sm:scale-100">
              <Hero config={previewConfig} animate={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
