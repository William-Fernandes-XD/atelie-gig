/**
 * Botão de ação que fica bloqueado enquanto `busy` for true.
 */
export function BusyButton({
  busy = false,
  children,
  busyLabel = 'Aguarde...',
  className = 'btn-primary',
  type = 'button',
  disabled = false,
  ...rest
}) {
  const locked = busy || disabled

  return (
    <button
      type={type}
      disabled={locked}
      aria-busy={busy || undefined}
      className={`${className} disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50`.trim()}
      {...rest}
    >
      {busy ? busyLabel : children}
    </button>
  )
}
