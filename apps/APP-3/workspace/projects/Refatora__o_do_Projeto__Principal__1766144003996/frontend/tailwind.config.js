
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background-dark': '#0a0d14',
        'surface-dark': '#1c1f26',
        'primary-blue': '#00bfff', // High-contrast blue for key actions
        'error-red': '#ff4d4f', // Industrial red for alerts
        'warning-orange': '#faad14', // Warning state color
        'success-green': '#52c41a', // Operational state color
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'], // Professional, high-readability font
      },
      animation: {
        'alert-flash': 'flash 1s ease-in-out infinite alternate',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.2 },
        }
      }
    },
  },
  plugins: [],
}
