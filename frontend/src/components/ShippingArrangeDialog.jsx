import { WHATSAPP_DISPLAY, WHATSAPP_URL } from '../constants/contact'

function WhatsAppIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function ShippingArrangeDialog({ open, onClose, phone }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shipping-arrange-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#FBF3F5] via-white to-[#F7E6EA] shadow-2xl ring-1 ring-brand-pink/40">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-pink/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-[#E8B4BC]/50 blur-2xl" />

        <div className="relative px-6 pb-6 pt-7 sm:px-8">
          <p className="text-center font-serif text-xs font-semibold uppercase tracking-[0.28em] text-[#C97B8A]">
            GIG · Moda Feminina
          </p>
          <h2
            id="shipping-arrange-title"
            className="mt-3 text-center font-serif text-2xl font-bold leading-snug text-brand-charcoal"
          >
            Frete a combinar
          </h2>
          <div className="mx-auto mt-3 flex max-w-[140px] items-center gap-2">
            <span className="h-px flex-1 bg-brand-charcoal/20" />
            <span className="text-[#E8A8B8]">♥</span>
            <span className="h-px flex-1 bg-brand-charcoal/20" />
          </div>

          <p className="mt-5 text-center text-sm leading-relaxed text-brand-charcoal/80">
            Ao selecionar essa opção, o vendedor entrará em contato com você por meio do telefone
            salvo na sua conta. Confira se seu telefone cadastrado é realmente o seu número.
            Em casos de dúvidas, você pode entrar em contato conosco informando o ID do pedido e
            o ocorrido.
          </p>

          {phone ? (
            <p className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-center text-xs text-brand-muted ring-1 ring-brand-pink/30">
              Telefone na sua conta:{' '}
              <span className="font-semibold text-brand-charcoal">{phone}</span>
            </p>
          ) : (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-800 ring-1 ring-amber-200/80">
              Você ainda não tem telefone cadastrado. Atualize em{' '}
              <a href="/minha-conta" className="font-semibold underline underline-offset-2">
                Minha conta
              </a>{' '}
              antes de finalizar.
            </p>
          )}

          <div className="mt-6 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-brand-pink/30">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-muted">
              Fale conosco
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 text-white shadow-md transition hover:bg-[#1fb855]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <WhatsAppIcon className="h-5 w-5" />
              </span>
              <span className="text-left">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-white/85">
                  WhatsApp
                </span>
                <span className="block font-serif text-lg font-bold leading-none tracking-wide">
                  {WHATSAPP_DISPLAY}
                </span>
              </span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-brand-charcoal px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-charcoal/90"
          >
            Entendi, continuar
          </button>
        </div>
      </div>
    </div>
  )
}
