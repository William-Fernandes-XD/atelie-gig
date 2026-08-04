export const DEFAULT_HERO = {
  id: null,
  active: true,
  titleLine1: 'Vestidos que contam',
  titleLine2: 'histórias',
  titleLine2Color: '#9B8FD9',
  titleFontWeight: 'bold',
  titleFontSize: 'md',
  description: 'Descubra peças exclusivas da GIG, criadas com elegância para mulheres especiais.',
  buttonText: 'Conheça a coleção',
  buttonLink: '#colecao',
  buttonBackground: '#E8A8B8',
  buttonTextColor: '#2B2B2B',
  buttonBorderRadius: 'full',
  buttonVisible: true,
  buttonHoverBackground: '#E0A4AE',
  secondaryButton1Text: '',
  secondaryButton1Url: '',
  secondaryButton1Color: '#9B8FD9',
  secondaryButton1Visible: false,
  secondaryButton2Text: '',
  secondaryButton2Url: '',
  secondaryButton2Color: '#9B8FD9',
  secondaryButton2Visible: false,
  heroImageUrl: '/images/hero-boutique.png',
  logoImageUrl: null,
  backgroundType: 'gradient',
  backgroundColor: '#FBF3F5',
  backgroundGradient: 'from-[#F7E6EA] via-[#FBF3F5] to-[#F3DDE3]',
  backgroundImageUrl: null,
  overlayColor: '#000000',
  overlayOpacity: 0,
  textAlignment: 'center',
  heroHeight: 'medium',
  imagePosition: 'right',
  features: [
    { id: 'd1', icon: 'dress', title: 'Peças exclusivas', displayOrder: 0 },
    { id: 'd2', icon: 'heart', title: 'Feito para você', displayOrder: 1 },
    { id: 'd3', icon: 'sparkle', title: 'Elegância em cada detalhe', displayOrder: 2 },
  ],
}

export function resolveHeroMediaUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url
  }
  if (url.startsWith('/images/')) {
    return url
  }
  const baseUrl = import.meta.env.VITE_API_URL || ''
  return `${baseUrl}${url}`
}

export function mergeHeroConfig(data) {
  if (!data) return { ...DEFAULT_HERO, features: [...DEFAULT_HERO.features] }
  return {
    ...DEFAULT_HERO,
    ...data,
    features: Array.isArray(data.features) && data.features.length
      ? data.features
      : [...DEFAULT_HERO.features],
  }
}
