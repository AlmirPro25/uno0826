
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#8B5CF6',    // Indigo/Purple
                'primary-dark': '#7C3AED', // Slightly darker primary
                'primary-light': '#A78BFA', // Slightly lighter primary
                secondary: '#4F46E5',  // Darker Indigo
                'secondary-dark': '#4338CA', // Slightly darker secondary
                accent: '#10B981',     // Teal/Green
                'accent-dark': '#059669', // Slightly darker accent
                'accent-light': '#34D399', // Slightly lighter accent
                background: '#0F172A', // Dark Blue/Slate
                text: '#E2E8F0',       // Light Gray/Slate
                'text-dark': '#CBD5E1', // Slightly darker text for contrast
                'surface-light': '#1E293B', // Slightly lighter surface than background
                'surface-card': '#334155', // Card surface
            },
            fontFamily: {
                sans: ['Roboto', 'sans-serif'],
                heading: ['Exo 2', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
            animation: {
                fadeAndScale: 'fadeAndScale 0.3s ease-out forwards',
                slideInLeft: 'slideInLeft 0.3s ease-out forwards',
                pulse: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                ripple: 'ripple 0.6s linear',
            },
            keyframes: {
                fadeAndScale: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                pulse: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '.5' },
                },
                ripple: {
                    '0%': { transform: 'scale(0)', opacity: '1' },
                    '100%': { transform: 'scale(1)', opacity: '0' },
                },
            },
        },
    },
    plugins: [],
};

