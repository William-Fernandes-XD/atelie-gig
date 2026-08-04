import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { Hero } from './hero/Hero'
import { DEFAULT_HERO, mergeHeroConfig } from './hero/heroDefaults'

function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden border-b border-brand-pink/30 bg-gradient-to-br from-[#F7E6EA] via-[#FBF3F5] to-[#F3DDE3] dark:border-neon-line/10 dark:from-neon-surface dark:via-neon-bg dark:to-neon-bg">
      <div className="relative mx-auto grid min-h-[min(48vh,420px)] max-w-[1600px] animate-pulse lg:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-4 px-5 py-8">
          <div className="h-8 w-24 rounded bg-neon-text/10" />
          <div className="h-3 w-32 rounded bg-neon-text/10" />
          <div className="mt-4 h-8 w-64 max-w-full rounded bg-neon-text/10" />
          <div className="h-16 w-full max-w-md rounded bg-neon-text/10" />
          <div className="mt-2 h-10 w-40 rounded-full bg-neon-text/10" />
        </div>
        <div className="min-h-[220px] bg-neon-text/5 sm:min-h-[260px]" />
      </div>
    </section>
  )
}

export function HomeHero({ search = '' }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['cms-hero'],
    queryFn: async () => (await api.get('/api/cms/hero')).data,
    staleTime: 60_000,
    retry: 1,
  })

  if (search) {
    return (
      <section className="bg-gradient-to-b from-brand-pink/30 to-neon-bg px-4 py-12 text-center sm:px-6 dark:from-neon-surface dark:to-neon-bg">
        <h1 className="font-display text-3xl font-bold text-neon-text md:text-4xl">
          Resultados para &ldquo;{search}&rdquo;
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-neon-muted">
          Use os filtros ao lado para refinar sua busca.
        </p>
      </section>
    )
  }

  if (isLoading && !data && !isError) {
    return <HeroSkeleton />
  }

  const config = mergeHeroConfig(isError ? null : data) || DEFAULT_HERO

  return <Hero config={config} />
}
