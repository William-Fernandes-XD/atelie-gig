/** Formata data/hora da API (LocalDateTime em America/Sao_Paulo) sem deslocar fuso. */
export function formatDateTime(value) {
  if (!value) return '—'

  const raw = String(value).trim()
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?/,
  )

  if (match) {
    const [, y, mo, d, h, mi, s = '00'] = match
    return `${d}/${mo}/${y}, ${h}:${mi}:${s.padStart(2, '0')}`
  }

  try {
    return new Date(raw).toLocaleString('pt-BR')
  } catch {
    return raw
  }
}
