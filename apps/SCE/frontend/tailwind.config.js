/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(217.2 32.6% 17.5%)',
        background: 'hsl(222.2 84% 4.9%)',
        foreground: 'hsl(210 40% 98%)',
        primary: {
          DEFAULT: '#00f2ff',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'hsl(217.2 32.6% 17.5%)',
          foreground: 'hsl(215 20.2% 65.1%)',
        },
        accent: {
          DEFAULT: 'hsl(217.2 32.6% 17.5%)',
          foreground: 'hsl(210 40% 98%)',
        },
        card: {
          DEFAULT: 'hsl(222.2 84% 4.9%)',
          foreground: 'hsl(210 40% 98%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 242, 255, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 242, 255, 0.4)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(30, 41, 59, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(30, 41, 59, 0.5) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
