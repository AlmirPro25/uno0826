
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mars: {
          base: '#0B0B0F', // Deep Void
          surface: '#1A1A1E', // Hull Plating
          red: '#FF4D4D', // Oxide Warning
          rust: '#C1440E', // Martian Soil
          cyan: '#00F0FF', // Colony Life Support
          glass: 'rgba(11, 11, 15, 0.7)',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'], // Technical Readout
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
