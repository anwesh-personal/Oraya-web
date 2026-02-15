/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Using CSS variables for theming
                primary: 'var(--primary)',
                'primary-foreground': 'var(--primary-foreground)',
                secondary: 'var(--secondary)',
                'secondary-foreground': 'var(--secondary-foreground)',

                // Alias "brand" to "primary" for backward compat
                brand: {
                    400: 'var(--primary)',
                    500: 'var(--primary)',
                    600: 'var(--primary-hover)',
                },

                surface: {
                    0: 'var(--surface-0)',
                    50: 'var(--surface-50)',
                    100: 'var(--surface-100)',
                    200: 'var(--surface-200)',
                    300: 'var(--surface-300)',
                    400: 'var(--surface-400)',
                    500: 'var(--surface-500)',
                    600: 'var(--surface-600)',
                    700: 'var(--surface-700)',
                    800: 'var(--surface-800)',
                    900: 'var(--surface-900)',
                },
                success: 'var(--success)',
                warning: 'var(--warning)',
                error: 'var(--error)',
                info: 'var(--info)',
            },
            fontFamily: {
                sans: ['var(--font-primary)', 'Inter', 'system-ui', 'sans-serif'],
                display: ['var(--font-display)', 'Outfit', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'JetBrains Mono', 'Consolas', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'pulse-slow': 'pulse 3s ease-in-out infinite',
                shimmer: 'shimmer 2s linear infinite',
                'gradient-x': 'gradientX 6s ease infinite',
                'float-slow': 'floatSlow 20s ease-in-out infinite',
                'float-slower': 'floatSlower 30s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px var(--primary-glow)' },
                    '50%': { boxShadow: '0 0 40px var(--primary-glow)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                gradientX: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                floatSlow: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
                    '66%': { transform: 'translate(-20px, 15px) scale(0.95)' },
                },
                floatSlower: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '25%': { transform: 'translate(-25px, 25px) scale(1.03)' },
                    '50%': { transform: 'translate(15px, -15px) scale(0.97)' },
                    '75%': { transform: 'translate(20px, 10px) scale(1.02)' },
                },
            },
        },
    },
    plugins: [],
};
