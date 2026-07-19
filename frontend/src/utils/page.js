import { PAGE_SIZE } from '../constants/pagination'

/** Extrai lista de respostas pageable (Spring Page) ou array legado. */
export function pageContent(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.content || []
}

/** Metadados de paginação a partir de um Spring Page. */
export function pageMeta(data, fallbackSize = PAGE_SIZE) {
  if (!data || Array.isArray(data)) {
    const total = Array.isArray(data) ? data.length : 0
    return {
      page: 0,
      size: fallbackSize,
      totalElements: total,
      totalPages: total === 0 ? 0 : Math.ceil(total / fallbackSize),
      first: true,
      last: true,
    }
  }

  return {
    page: data.number ?? 0,
    size: data.size ?? fallbackSize,
    totalElements: data.totalElements ?? pageContent(data).length,
    totalPages: data.totalPages ?? 0,
    first: data.first ?? true,
    last: data.last ?? true,
  }
}

/** Fatia local de uma lista já filtrada (paginação client-side). */
export function slicePage(items, page = 0, size = PAGE_SIZE) {
  const list = items || []
  const start = page * size
  return list.slice(start, start + size)
}
