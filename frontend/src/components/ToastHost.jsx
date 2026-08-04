import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'

const TONE = {
  info: 'border-sky-200/80 bg-sky-50 text-sky-950 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-100',
  success:
    'border-brand-pink/50 bg-white text-brand-charcoal shadow-neon dark:border-brand-pink/30 dark:bg-neon-surface dark:text-neon-text',
  error: 'border-red-200/80 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200',
  warn: 'border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100',
}

const ICON_WRAP = {
  info: 'bg-sky-500 text-white',
  success: 'bg-brand-pink text-brand-charcoal dark:bg-brand-pink dark:text-brand-charcoal',
  error: 'bg-red-500 text-white',
  warn: 'bg-amber-500 text-white',
}

const ICON = {
  info: 'ℹ',
  success: '✓',
  error: '!',
  warn: '!',
}

export function ToastHost() {
  const toast = useUiStore((s) => s.toast)
  const clearToast = useUiStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => clearToast(), toast.durationMs ?? 4500)
    return () => clearTimeout(timer)
  }, [toast, clearToast])

  if (!toast) return null

  const type = toast.type || 'info'
  const tone = TONE[type] || TONE.info

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[80] w-[min(100%-2rem,22rem)] sm:right-6 sm:top-6"
      style={{ animation: 'growl-in 0.28s ease-out' }}
    >
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto overflow-hidden rounded-2xl border px-4 py-3.5 shadow-lg backdrop-blur-md ${tone}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ICON_WRAP[type] || ICON_WRAP.info}`}
            aria-hidden
          >
            {ICON[type] || ICON.info}
          </span>

          <div className="min-w-0 flex-1">
            {toast.title && (
              <p className="text-sm font-semibold leading-snug">{toast.title}</p>
            )}
            <p className={`text-sm leading-relaxed ${toast.title ? 'mt-0.5 opacity-90' : 'font-medium'}`}>
              {toast.message}
            </p>
            {toast.actionLabel && toast.actionTo && (
              <Link
                to={toast.actionTo}
                onClick={clearToast}
                className="mt-2 inline-flex text-sm font-semibold text-brand-purple underline-offset-2 hover:underline dark:text-brand-pink"
              >
                {toast.actionLabel}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={clearToast}
            className="shrink-0 rounded-lg px-1 text-lg leading-none opacity-50 transition hover:opacity-100"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
