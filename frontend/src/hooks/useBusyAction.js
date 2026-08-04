import { useCallback, useRef, useState } from 'react'

/**
 * Trava ações assíncronas: só permite um clique até a Promise terminar.
 */
export function useBusyAction() {
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)

  const run = useCallback(async (fn) => {
    if (busyRef.current) return undefined
    busyRef.current = true
    setBusy(true)
    try {
      return await fn()
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [])

  return { busy, run }
}
