
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          bg: '#0F0F12',    // Onyx Deep
          panel: '#18181B', // Onyx Surface
          border: '#27272A',
          orange: '#FF5F1F', // Alert Orange
          green: '#39FF14',  // Safety Green
          red: '#EF4444',
          text: '#E4E4E7',
          muted: '#A1A1AA'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-spin': 'spin 4s linear infinite',
      }
    },
  },
  plugins: [],
}
