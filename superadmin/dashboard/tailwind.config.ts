import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Brand colors
                brand: {
                    50: "#f0f4ff",
                    100: "#e0e9ff",
                    200: "#c7d6fe",
                    300: "#a4b8fc",
                    400: "#8093f8",
                    500: "#6366f1", // Primary brand
                    600: "#5145e5",
                    700: "#4536ca",
                    800: "#3a2fa3",
                    900: "#332d81",
                    950: "#1e1a4b",
                },
                // Accent colors
                accent: {
                    cyan: "#22d3ee",
                    emerald: "#34d399",
                    amber: "#fbbf24",
                    rose: "#fb7185",
                    violet: "#a78bfa",
                },
                // Dark mode surface colors
                surface: {
                    0: "#09090b",    // Deepest black (background)
                    50: "#0f0f12",   // Card backgrounds
                    100: "#18181b",  // Elevated surfaces
                    200: "#1f1f23",  // Hover states
                    300: "#27272a",  // Active states
                    400: "#3f3f46",  // Borders
                    500: "#52525b",  // Muted text
                    600: "#71717a",  // Secondary text
                    700: "#a1a1aa",  // Primary text
                    800: "#d4d4d8",  // Bright text
                    900: "#fafafa",  // White text
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            fontSize: {
                "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
            },
            borderRadius: {
                "4xl": "2rem",
            },
            boxShadow: {
                glow: "0 0 20px -5px rgba(99, 102, 241, 0.4)",
                "glow-lg": "0 0 40px -10px rgba(99, 102, 241, 0.5)",
                "inner-glow": "inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                "gradient-mesh": "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 50%, rgba(34, 211, 238, 0.1) 100%)",
                "noise": "url('/noise.png')",
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-out",
                "slide-up": "slideUp 0.5s ease-out",
                "slide-down": "slideDown 0.3s ease-out",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "shimmer": "shimmer 2s infinite linear",
                "spin-slow": "spin 3s linear infinite",
                "bounce-subtle": "bounceSubtle 2s infinite",
                "glow": "glow 2s ease-in-out infinite alternate",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideDown: {
                    "0%": { opacity: "0", transform: "translateY(-10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
                bounceSubtle: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-3px)" },
                },
                glow: {
                    "0%": { boxShadow: "0 0 5px rgba(99, 102, 241, 0.3)" },
                    "100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.6)" },
                },
            },
            transitionTimingFunction: {
                "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            },
        },
    },
    plugins: [],
};

export default config;
