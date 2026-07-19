import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const WHATSAPP_NUMBER = '5562981451856'
const WHATSAPP_DISPLAY = '(62) 98145-1856'
const INSTAGRAM_HANDLE = '@gig-modafeminina'
const INSTAGRAM_URL = 'https://instagram.com/gig-modafeminina'
const ADDRESS = 'Rua Serra Dourada — 74573-320, Goiânia/GO'

const MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3822.8364582477657!2d-49.28326952508313!3d-16.6349749841295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x935ef37c44bc701b%3A0x9087dc9d81c1c0ed!2sR.%20Serra%20Dourada%2C%20484%20-%20Jardim%20Diamantina%2C%20Goi%C3%A2nia%20-%20GO%2C%2074573-320!5e0!3m2!1spt-BR!2sbr!4v1783636074871!5m2!1spt-BR!2sbr'

function WhatsAppIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function InstagramIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function PinIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="bg-brand-pink text-brand-charcoal">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Sobre nós + logo */}
            <div className="lg:col-span-5">
              <div className="mb-6 inline-flex rounded-2xl bg-white px-4 py-3 shadow-sm">
                <Logo size="sm" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-brand-charcoal">
                Moda Feminina em Goiânia
              </h2>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand-charcoal/70">
                Sobre nós
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-charcoal/80">
                Somos uma empresa com a sede localizada em Goiânia, com o maior foco na produção de
                vestidos longos e curtos. Também produzimos blusinhas e calças. Tudo pelo preço mais
                acessível do Estado.
              </p>
            </div>

            {/* Fale conosco */}
            <div className="lg:col-span-4">
              <h3 className="text-lg font-bold text-brand-charcoal">
                Fale Conosco
                <span className="mt-2 block h-0.5 w-12 rounded-full bg-white" />
              </h3>

              <div className="mt-6 space-y-4">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                    <WhatsAppIcon className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      WhatsApp
                    </p>
                    <p className="text-lg font-bold text-brand-charcoal">{WHATSAPP_DISPLAY}</p>
                  </div>
                </a>

                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-pink-dark text-brand-charcoal">
                    <InstagramIcon className="h-7 w-7" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      Instagram
                    </p>
                    <p className="text-lg font-bold text-brand-charcoal">{INSTAGRAM_HANDLE}</p>
                  </div>
                </a>

                <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <span className="mt-0.5 shrink-0 text-brand-pink-dark">
                    <PinIcon />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      Endereço
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-charcoal/80">{ADDRESS}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Instagram */}
            <div className="lg:col-span-3">
              <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-white p-6 text-center shadow-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-pink">
                  <InstagramIcon className="h-8 w-8 text-brand-charcoal" />
                </span>
                <p className="mt-4 font-serif text-lg font-bold text-brand-charcoal">Siga a GIG</p>
                <p className="mt-2 text-sm text-brand-muted">
                  Acompanhe novidades, looks e lançamentos no nosso Instagram!
                </p>
                <p className="mt-3 text-sm font-semibold text-brand-charcoal">{INSTAGRAM_HANDLE}</p>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-charcoal px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-charcoal/90"
                >
                  <InstagramIcon className="h-4 w-4" />
                  Acessar perfil
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="bg-brand-pink px-4 pb-8 pt-2 sm:px-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-white p-2 shadow-md">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl sm:aspect-[21/9]">
            <iframe
              src={MAP_EMBED}
              title="Localização GIG — Moda Feminina"
              className="absolute inset-0 h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-brand-pink-dark/40 bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-brand-muted">
            © {new Date().getFullYear()} GIG — Moda Feminina. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-brand-muted transition hover:text-brand-charcoal">
              Início
            </Link>
            <Link to="/cadastro" className="text-xs text-brand-muted transition hover:text-brand-charcoal">
              Cadastro
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-muted transition hover:text-[#25D366]"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-muted transition hover:text-brand-charcoal"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
