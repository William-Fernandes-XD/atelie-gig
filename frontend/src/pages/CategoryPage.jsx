import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { ProductListingLayout } from '../components/ProductListingLayout'

export default function CategoryPage() {
  const { id } = useParams()

  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['category', id],
    queryFn: async () => (await api.get(`/api/categories/${id}`)).data,
    enabled: !!id,
  })

  if (loadingCategory) {
    return <p className="p-10 text-center text-brand-muted">Carregando categoria...</p>
  }

  return (
    <ProductListingLayout
      fixedCategoryId={id}
      emptyMessage="Nenhum produto nesta categoria com os filtros selecionados."
      hero={(
        <section className="bg-brand-pink/30 px-4 py-10 text-center sm:px-6">
          <p className="text-xs uppercase tracking-wider text-brand-muted">Categoria</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-charcoal">{category?.name}</h1>
          {category?.description && (
            <p className="mx-auto mt-2 max-w-2xl text-sm text-brand-muted">{category.description}</p>
          )}
        </section>
      )}
    />
  )
}
