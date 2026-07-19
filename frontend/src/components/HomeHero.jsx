function HeartIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21s-6.7-4.35-9.33-7.4C.8 11.4.5 8.7 2.1 6.9 3.5 5.3 5.9 5.1 7.6 6.4L12 10l4.4-3.6c1.7-1.3 4.1-1.1 5.5.5 1.6 1.8 1.3 4.5-.57 6.7C18.7 16.65 12 21 12 21z" />
    </svg>
  )
}

function DressIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4l-1 3 2 1v2L6 14l1 6h10l1-6-4-4V8l2-1-1-3-3 1-3-1z" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l1.2 4.8L18 8l-4.8 1.2L12 14l-1.2-4.8L6 8l4.8-1.2L12 2z" />
      <path d="M19 13l.7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13z" opacity=".85" />
      <path d="M5 14l.6 2L8 17l-2.4.6L5 20l-.6-2.4L2 17l2.4-.6L5 14z" opacity=".7" />
    </svg>
  )
}

const FEATURES = [
  { label: 'Peças exclusivas', icon: DressIcon },
  {
    label: 'Feito para você',
    icon: () => <HeartIcon className="h-5 w-5" />,
  },
  { label: 'Elegância em cada detalhe', icon: SparkleIcon },
]

export function HomeHero({ search = '' }) {
  if (search) {
    return (
      <section className="bg-gradient-to-b from-[#F8E8EC] to-white px-4 py-12 text-center sm:px-6">
        <h1 className="font-serif text-3xl font-bold text-brand-charcoal md:text-4xl">
          Resultados para &ldquo;{search}&rdquo;
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-brand-muted">
          Use os filtros ao lado para refinar sua busca.
        </p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden bg-gradient-to-br from-[#F7E6EA] via-[#FBF3F5] to-[#F3DDE3]">
      <div className="mx-auto grid min-h-[min(48vh,420px)] max-w-[1600px] lg:grid-cols-2">
        {/* Menu / conteúdo */}
        <div className="flex flex-col items-center justify-center px-5 py-8 text-center sm:px-8 lg:px-12 lg:py-10">
          <div className="animate-[hero-fade-up_0.7s_ease-out_both]">
            <p className="font-serif text-3xl font-bold tracking-[0.3em] text-brand-charcoal sm:text-4xl">
              GIG
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-brand-charcoal/80">
              Moda Feminina
            </p>
            <div className="mt-2 flex items-center justify-center text-[#E8A8B8]">
              <HeartIcon className="h-3 w-3" />
            </div>
          </div>

          <div className="mt-5 max-w-md animate-[hero-fade-up_0.8s_ease-out_0.1s_both]">
            <h1 className="font-serif text-2xl font-bold leading-snug text-brand-charcoal sm:text-3xl">
              Vestidos que contam <em className="italic font-semibold">histórias</em>
            </h1>

            <div className="mx-auto mt-3 flex max-w-[180px] items-center gap-2">
              <span className="h-px flex-1 bg-brand-charcoal/25" />
              <HeartIcon className="h-2.5 w-2.5 text-[#E8A8B8]" />
              <span className="h-px flex-1 bg-brand-charcoal/25" />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-brand-muted sm:text-sm">
              Descubra peças exclusivas da GIG, criadas com elegância para mulheres especiais.
            </p>

            <a
              href="#colecao"
              className="mt-5 inline-flex rounded-full bg-[#E8B4BC] px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-charcoal shadow-sm transition hover:bg-[#E0A4AE]"
            >
              Conheça a coleção
            </a>
          </div>

          <ul className="mt-6 grid w-full max-w-md grid-cols-3 gap-2 animate-[hero-fade-up_0.9s_ease-out_0.2s_both] sm:gap-4">
            {FEATURES.map(({ label, icon: Icon }) => (
              <li key={label} className="flex flex-col items-center gap-1.5 text-[#C97B8A]">
                <Icon />
                <span className="text-[8px] font-semibold uppercase leading-tight tracking-wide sm:text-[9px]">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Foto da mulher */}
        <div className="relative min-h-[220px] overflow-hidden sm:min-h-[260px] lg:min-h-full">
          <img
            src="/images/hero-woman.png"
            alt="Modelo GIG vestindo peça da coleção"
            className="absolute inset-0 h-full w-full object-cover object-[center_18%] animate-[hero-fade-in_1s_ease-out_both]"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#F7E6EA]/80 to-transparent lg:w-16" />
        </div>
      </div>
    </section>
  )
}
