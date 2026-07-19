import { useSearchParams } from 'react-router-dom'
import { HomeHero } from '../components/HomeHero'
import { ProductListingLayout } from '../components/ProductListingLayout'

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const search = searchParams.get('q') || ''

  return (
    <ProductListingLayout
      emptyMessage={
        search ? 'Nenhum produto encontrado para essa busca ou filtros.' : 'Nenhum produto encontrado.'
      }
      hero={<HomeHero search={search} />}
      listingId="colecao"
    />
  )
}
