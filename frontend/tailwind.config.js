/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Paleta original GIG
          pink: '#F2C4D0',
          'pink-dark': '#E8A8B8',
          rose: '#C48C8C',
          purple: '#9B8FD9',
          'purple-dark': '#7B6FC4',
          charcoal: '#2B2B2B',
          muted: '#6B6B6B',
        },
        neon: {
          bg: 'rgb(var(--neon-bg) / <alpha-value>)',
          surface: 'rgb(var(--neon-surface) / <alpha-value>)',
          card: 'rgb(var(--neon-card) / <alpha-value>)',
          pink: 'rgb(var(--accent-pink) / <alpha-value>)',
          cyan: 'rgb(var(--accent-cyan) / <alpha-value>)',
          violet: 'rgb(var(--accent-violet) / <alpha-value>)',
          text: 'rgb(var(--neon-text) / <alpha-value>)',
          muted: 'rgb(var(--neon-muted) / <alpha-value>)',
          line: 'rgb(var(--neon-line) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        serif: ['Syne', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: 'var(--shadow-neon)',
        'neon-cyan': 'var(--shadow-neon-cyan)',
      },
      backgroundImage: {
        'neon-grid':
          'linear-gradient(rgb(var(--neon-line) / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--neon-line) / 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'neon-grid': '56px 56px',
      },
    },
  },
  plugins: [],
}
