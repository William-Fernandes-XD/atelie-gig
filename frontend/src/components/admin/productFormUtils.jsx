function extractApiError(err) {
  if (err.message && !err.response) return err.message
  const data = err.response?.data
  if (data?.details && typeof data.details === 'object') {
    return Object.values(data.details).join(' ')
  }
  return data?.message || 'Erro ao processar a solicitação.'
}

function resolveImageUrl(url) {
  if (!url) return null
  const baseUrl = import.meta.env.VITE_API_URL || ''
  return `${baseUrl}${url}`
}

function ImageUploadBox({ label, previewUrl, fileName, onUpload, uploading, compact = false }) {
  const content = (
    <>
      {label && !compact && (
        <legend className="px-1 text-sm font-semibold text-neon-text">{label}</legend>
      )}

      <div className={`${label && !compact ? 'mt-3' : ''} flex flex-col gap-3`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            readOnly
            value={fileName || 'Nenhuma imagem selecionada'}
            className="admin-input min-w-0 flex-1 truncate"
          />
          <label className="inline-flex shrink-0 cursor-pointer items-center rounded-xl border border-neon-line/15 bg-neon-card/50 px-4 py-2.5 text-sm font-medium text-neon-text transition hover:bg-brand-pink/30 dark:hover:bg-white/10">
            {uploading ? 'Enviando...' : 'Upload'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUpload(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>

        {previewUrl && (
          <div className="overflow-hidden rounded-xl border border-neon-line/10 bg-neon-card/40 p-3">
            <img src={previewUrl} alt="Preview" className="mx-auto max-h-64 w-full object-contain" />
          </div>
        )}
      </div>
    </>
  )

  if (compact) return <div>{content}</div>

  return <fieldset className="admin-fieldset">{content}</fieldset>
}

export { extractApiError, resolveImageUrl, ImageUploadBox }
