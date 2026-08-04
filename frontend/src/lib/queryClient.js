import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query'

const PERSIST_KEY = 'atelie-gg-query-cache-v1'
const PERSIST_MAX_AGE_MS = 1000 * 60 * 30 // 30 min
const CATALOG_KEYS = new Set(['products', 'product-filters', 'categories', 'category'])

function shouldPersistQuery(query) {
  const root = query.queryKey?.[0]
  return CATALOG_KEYS.has(root) && query.state.status === 'success'
}

function saveCache(queryClient) {
  try {
    const state = dehydrate(queryClient, {
      shouldDehydrateQuery: shouldPersistQuery,
    })
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ savedAt: Date.now(), state }),
    )
  } catch {
    // quota / private mode — ignora
  }
}

function restoreCache(queryClient) {
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed?.state || !parsed?.savedAt) return
    if (Date.now() - parsed.savedAt > PERSIST_MAX_AGE_MS) {
      localStorage.removeItem(PERSIST_KEY)
      return
    }
    hydrate(queryClient, parsed.state)
  } catch {
    localStorage.removeItem(PERSIST_KEY)
  }
}

export function createAppQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Catálogo: 5 min “fresco” no navegador (menos hits no banco)
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

  restoreCache(queryClient)

  if (typeof window !== 'undefined') {
    let saveTimer
    const scheduleSave = () => {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => saveCache(queryClient), 1500)
    }
    queryClient.getQueryCache().subscribe(scheduleSave)
    window.addEventListener('beforeunload', () => saveCache(queryClient))
  }

  return queryClient
}

/** Após checkout/compra: atualiza estoque nas telas (sem limpar catálogo inteiro). */
export function invalidateStockRelatedQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['product'] })
  queryClient.invalidateQueries({ queryKey: ['products'] })
}
