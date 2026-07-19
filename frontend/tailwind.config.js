/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#F2C4D0',
          'pink-dark': '#E8A8B8',
          rose: '#C48C8C',
          purple: '#9B8FD9',
          'purple-dark': '#7B6FC4',
          charcoal: '#2B2B2B',
          muted: '#6B6B6B',
        },
      },
      fontFamily: {
        // Tipografia da loja (referência: sans geométrica — Montserrat)
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        serif: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
