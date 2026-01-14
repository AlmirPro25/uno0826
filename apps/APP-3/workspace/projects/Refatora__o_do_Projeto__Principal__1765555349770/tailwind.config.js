
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Cor de fundo principal
        card: '#1e293b',       // Cor de fundo dos cards/componentes
        accent: '#10b981',     // Cor de destaque (verde)
      }
    },
  },
  plugins: [],
}
