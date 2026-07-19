import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

const TONE = {
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-800',
  warn: 'border-amber-200 bg-amber-50 text-amber-900',
}

const ICON = {
  info: 'ℹ',
  success: '✓',
  error: '!',
  warn: '⚠',
}

export function ToastHost() {
  const toast = useUiStore((s) => s.toast)
  const clearToast = useUiStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => clearToast(), toast.durationMs ?? 5500)
    return () => clearTimeout(timer)
  }, [toast, clearToast])

  if (!toast) return null

  const type = toast.type || 'info'
  const tone = TONE[type] || TONE.info

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] w-[min(100%-2rem,22rem)]" style={{ animation: 'growl-in 0.25s ease-out' }}>
      <div
        role="status"
        className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${tone}`}
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold"
            aria-hidden
          >
            {ICON[type] || ICON.info}
          </span>
          <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
          <button
            type="button"
            onClick={clearToast}
            className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
