/** @type {import('tailwindcss').Config} */
// Tema corporativo Coodetrans — colores basados en el logo (azules y verdes)
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal — Azul cobalto eléctrico (identidad de marca)
        primary: {
          DEFAULT: '#0052D4',
          dark: '#003FA6',
          light: '#E8F0FD',
          mid: '#4D89E8',
        },
        // Estados
        ok: {
          DEFAULT: '#28A745',
          dark: '#1E7E34',
          light: '#D4EDDA',
        },
        danger: {
          DEFAULT: '#DC3545',
          light: '#F8D7DA',
        },
        warn: {
          DEFAULT: '#B45309',
          light: '#FEF3C7',
        },
        // Neutros
        canvas: '#F4F7F9',
        edge: '#E2E8F0',
        muted: '#94A3B8',
        subtle: '#64748B',
        ink: '#1E293B',
        'ink-dark': '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'card-hover': '0 4px 14px rgba(15,23,42,0.10)',
        sidebar: '2px 0 10px rgba(0,0,0,0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.25s cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [],
};
