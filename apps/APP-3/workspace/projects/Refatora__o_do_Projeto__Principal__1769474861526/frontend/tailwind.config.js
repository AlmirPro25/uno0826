
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aegis-black': '#050505',
        'aegis-green': '#33ff33',
        'aegis-dark-green': '#001a00',
        'aegis-alert': '#ff3333',
        'aegis-warn': '#ffcc00',
        'aegis-panel': 'rgba(0, 20, 0, 0.85)',
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #001a00 1px, transparent 1px), linear-gradient(to bottom, #001a00 1px, transparent 1px)",
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.98' },
          '52%': { opacity: '0.8' },
          '54%': { opacity: '0.98' },
        }
      }
    },
  },
  plugins: [],
}
