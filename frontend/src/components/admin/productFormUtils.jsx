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
        <legend className="px-1 text-sm font-semibold text-brand-charcoal">{label}</legend>
      )}

      <div className={`${label && !compact ? 'mt-3' : ''} flex flex-col gap-3`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            readOnly
            value={fileName || 'Nenhuma imagem selecionada'}
            className="admin-input min-w-0 flex-1 truncate bg-gray-50"
          />
          <label className="inline-flex shrink-0 cursor-pointer items-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-medium text-brand-charcoal transition hover:bg-brand-pink/30">
            {uploading ? 'Enviando...' : 'Upload'}
            <input
              type="file"
              accept="image/*"
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
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3">
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
