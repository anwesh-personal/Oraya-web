// ============================================
// ORAYA SUPERADMIN THEME SYSTEM
// 5 Distinct Themes × 2 Modes (Dark/Light)
// Each theme has UNIQUE fonts, surfaces, and color DNA
// ============================================

export type ThemeId = 'origin' | 'atelier' | 'aero' | 'sovereign' | 'operator';
export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
    // Primary brand
    primary: string;
    primaryForeground: string;
    primaryHover: string;
    primaryGlow: string;

    // Secondary accent
    secondary: string;
    secondaryForeground: string;

    // Surfaces (0=deepest bg, 900=highest contrast text)
    surface0: string;
    surface50: string;
    surface100: string;
    surface200: string;
    surface300: string;
    surface400: string;
    surface500: string;
    surface600: string;
    surface700: string;
    surface800: string;
    surface900: string;

    // Status colors
    success: string;
    successGlow: string;
    warning: string;
    warningGlow: string;
    error: string;
    errorGlow: string;
    info: string;
    infoGlow: string;

    // Gradients
    gradientPrimary: string;
    gradientSecondary: string;
    gradientAccent: string;
}

export interface ThemeVariant {
    colors: ThemeColors;
}

export interface ThemeFonts {
    primary: string;   // Body text
    display: string;   // Headings
    mono: string;      // Code
    url: string;       // Google Fonts URL
}

export interface Theme {
    id: ThemeId;
    name: string;
    description: string;
    fonts: ThemeFonts;
    borderRadius: string;
    preview: {
        primary: string;
        secondary: string;
        darkBg: string;
        lightBg: string;
    };
    dark: ThemeVariant;
    light: ThemeVariant;
}

export const themes: Record<ThemeId, Theme> = {
    // ============================================
    // ORIGIN — Cyberpunk Void (Electric Cyan + Hot Magenta)
    // Font: Inter · Radius: 12px · Neutral gray surfaces
    // ============================================
    origin: {
        id: 'origin',
        name: 'Origin',
        description: 'Deep space void with electric cyan',
        fonts: {
            primary: '"Inter", -apple-system, sans-serif',
            display: '"Inter", -apple-system, sans-serif',
            mono: '"JetBrains Mono", monospace',
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
        },
        borderRadius: '12px',
        preview: {
            primary: '#00F0FF',
            secondary: '#FF00AA',
            darkBg: '#050505',
            lightBg: '#F5F5F7',
        },
        dark: {
            colors: {
                primary: '#00F0FF',
                primaryForeground: '#000000',
                primaryHover: '#33F2FF',
                primaryGlow: 'rgba(0, 240, 255, 0.4)',

                secondary: '#FF00AA',
                secondaryForeground: '#ffffff',

                surface0: '#050505',
                surface50: '#0a0a0a',
                surface100: '#111111',
                surface200: '#1a1a1a',
                surface300: '#252525',
                surface400: '#333333',
                surface500: '#555555',
                surface600: '#888888',
                surface700: '#aaaaaa',
                surface800: '#dddddd',
                surface900: '#ffffff',

                success: '#00FF99',
                successGlow: 'rgba(0, 255, 153, 0.3)',
                warning: '#FFBB00',
                warningGlow: 'rgba(255, 187, 0, 0.3)',
                error: '#FF0044',
                errorGlow: 'rgba(255, 0, 68, 0.3)',
                info: '#00CCFF',
                infoGlow: 'rgba(0, 204, 255, 0.3)',

                gradientPrimary: 'linear-gradient(135deg, #00F0FF 0%, #0072FF 100%)',
                gradientSecondary: 'linear-gradient(135deg, #FF00AA 0%, #7C3AED 100%)',
                gradientAccent: 'linear-gradient(135deg, #00F0FF 0%, #FF00AA 100%)',
            },
        },
        light: {
            colors: {
                primary: '#0066FF',
                primaryForeground: '#ffffff',
                primaryHover: '#2980FF',
                primaryGlow: 'rgba(0, 102, 255, 0.15)',

                secondary: '#D6008F',
                secondaryForeground: '#ffffff',

                // Refined high-end light surfaces (Clean & Consistent)
                surface0: '#ffffff',     // Pure white base
                surface50: '#fafafa',    // Subtle elevation
                surface100: '#f5f5f7',   // Recessed sections
                surface200: '#efeff3',   // Borders / Input hover
                surface300: '#e5e5ea',   // High-contrast borders / Dividers
                surface400: '#d1d1d6',   // Inactive states
                surface500: '#8e8e93',   // Secondary text
                surface600: '#6e6e73',   // Muted text
                surface700: '#48484a',   // Strong text
                surface800: '#2c2c2e',   // Body text
                surface900: '#000000',   // Heading / Critical text

                success: '#009966',
                successGlow: 'rgba(0, 153, 102, 0.1)',
                warning: '#D48806',
                warningGlow: 'rgba(212, 136, 6, 0.1)',
                error: '#CF1322',
                errorGlow: 'rgba(207, 19, 34, 0.1)',
                info: '#0050B3',
                infoGlow: 'rgba(0, 80, 179, 0.1)',

                gradientPrimary: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
                gradientSecondary: 'linear-gradient(135deg, #D6008F 0%, #9D0068 100%)',
                gradientAccent: 'linear-gradient(135deg, #0066FF 0%, #D6008F 100%)',
            },
        },
    },

    // ============================================
    // ATELIER — Vintage Craftsmanship (Gold + Sienna)
    // Font: Lora (serif body) + Playfair Display (headings)
    // Radius: 4px · Warm cream/parchment surfaces
    // ============================================
    atelier: {
        id: 'atelier',
        name: 'Atelier',
        description: 'Analog warmth, artisan craft',
        fonts: {
            primary: '"Lora", Georgia, serif',
            display: '"Playfair Display", Georgia, serif',
            mono: '"IBM Plex Mono", monospace',
            url: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap',
        },
        borderRadius: '4px',
        preview: {
            primary: '#C5A55A',
            secondary: '#8B4513',
            darkBg: '#1A1610',
            lightBg: '#F5EDE0',
        },
        dark: {
            colors: {
                primary: '#C5A55A',
                primaryForeground: '#1A1610',
                primaryHover: '#D4B76A',
                primaryGlow: 'rgba(197, 165, 90, 0.35)',

                secondary: '#A0522D',
                secondaryForeground: '#F5EDE0',

                // Warm charcoal-brown surfaces
                surface0: '#0F0D0A',
                surface50: '#181510',
                surface100: '#221F18',
                surface200: '#2C2820',
                surface300: '#3D3728',
                surface400: '#524A38',
                surface500: '#6A6050',
                surface600: '#8A806E',
                surface700: '#B0A898',
                surface800: '#D8D0C0',
                surface900: '#F0E8D8',

                success: '#7A9A3A',
                successGlow: 'rgba(122, 154, 58, 0.25)',
                warning: '#D4A020',
                warningGlow: 'rgba(212, 160, 32, 0.25)',
                error: '#C05050',
                errorGlow: 'rgba(192, 80, 80, 0.25)',
                info: '#5A8A8A',
                infoGlow: 'rgba(90, 138, 138, 0.25)',

                gradientPrimary: 'linear-gradient(135deg, #C5A55A 0%, #A08838 100%)',
                gradientSecondary: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
                gradientAccent: 'linear-gradient(135deg, #C5A55A 0%, #8B4513 100%)',
            },
        },
        light: {
            colors: {
                primary: '#6B4226',
                primaryForeground: '#FDF8F0',
                primaryHover: '#7D4F30',
                primaryGlow: 'rgba(107, 66, 38, 0.15)',

                secondary: '#2F5233',
                secondaryForeground: '#FDF8F0',

                // Warm cream / parchment / linen surfaces
                surface0: '#EDE4D4',
                surface50: '#F5EDE0',
                surface100: '#FDF8F0',
                surface200: '#F8F0E4',
                surface300: '#D8CDB8',
                surface400: '#BFAF92',
                surface500: '#9C8B6E',
                surface600: '#7A6B52',
                surface700: '#5A4C38',
                surface800: '#3A3025',
                surface900: '#2A2018',

                success: '#4A7525',
                successGlow: 'none',
                warning: '#B07B15',
                warningGlow: 'none',
                error: '#933030',
                errorGlow: 'none',
                info: '#3A6B6B',
                infoGlow: 'none',

                gradientPrimary: 'linear-gradient(135deg, #6B4226 0%, #4A2D1A 100%)',
                gradientSecondary: 'linear-gradient(135deg, #2F5233 0%, #1F3822 100%)',
                gradientAccent: 'linear-gradient(135deg, #6B4226 0%, #2F5233 100%)',
            },
        },
    },

    // ============================================
    // AERO — Swiss Brutalism (Pure B&W + Electric Orange)
    // Font: Outfit (geometric sans) · Radius: 6px
    // Sharp contrast, editorial precision
    // ============================================
    aero: {
        id: 'aero',
        name: 'Aero',
        description: 'Swiss precision, zero noise',
        fonts: {
            primary: '"Outfit", "Helvetica Neue", sans-serif',
            display: '"Outfit", "Helvetica Neue", sans-serif',
            mono: '"JetBrains Mono", monospace',
            url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
        },
        borderRadius: '6px',
        preview: {
            primary: '#FFFFFF',
            secondary: '#FF4F00',
            darkBg: '#000000',
            lightBg: '#FFFFFF',
        },
        dark: {
            colors: {
                primary: '#FFFFFF',
                primaryForeground: '#000000',
                primaryHover: '#E5E5E5',
                primaryGlow: 'rgba(255, 255, 255, 0.15)',

                secondary: '#FF4F00',
                secondaryForeground: '#ffffff',

                // Pure neutral black → gray
                surface0: '#000000',
                surface50: '#080808',
                surface100: '#101010',
                surface200: '#181818',
                surface300: '#252525',
                surface400: '#333333',
                surface500: '#404040',
                surface600: '#666666',
                surface700: '#A0A0A0',
                surface800: '#D0D0D0',
                surface900: '#FFFFFF',

                success: '#00D26A',
                successGlow: 'none',
                warning: '#FFCC00',
                warningGlow: 'none',
                error: '#FF0033',
                errorGlow: 'none',
                info: '#0099FF',
                infoGlow: 'none',

                gradientPrimary: 'linear-gradient(135deg, #FFFFFF 0%, #CCCCCC 100%)',
                gradientSecondary: 'linear-gradient(135deg, #FF4F00 0%, #FF6A26 100%)',
                gradientAccent: 'linear-gradient(135deg, #FFFFFF 0%, #FF4F00 100%)',
            },
        },
        light: {
            colors: {
                primary: '#000000',
                primaryForeground: '#FFFFFF',
                primaryHover: '#1A1A1A',
                primaryGlow: 'none',

                secondary: '#FF4F00',
                secondaryForeground: '#FFFFFF',

                // Pure stark white — maximum contrast editorial
                surface0: '#F2F2F2',
                surface50: '#FAFAFA',
                surface100: '#FFFFFF',
                surface200: '#F5F5F5',
                surface300: '#E0E0E0',
                surface400: '#BDBDBD',
                surface500: '#9E9E9E',
                surface600: '#757575',
                surface700: '#424242',
                surface800: '#212121',
                surface900: '#000000',

                success: '#00873E',
                successGlow: 'none',
                warning: '#E68A00',
                warningGlow: 'none',
                error: '#D50000',
                errorGlow: 'none',
                info: '#0066CC',
                infoGlow: 'none',

                gradientPrimary: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                gradientSecondary: 'linear-gradient(135deg, #FF4F00 0%, #E64600 100%)',
                gradientAccent: 'linear-gradient(135deg, #000000 0%, #FF4F00 100%)',
            },
        },
    },

    // ============================================
    // SOVEREIGN — Royal Luxury (Deep Violet + Gold)
    // Font: Manrope (headings) + DM Sans (body)
    // Radius: 16px · Indigo-tinted surfaces
    // ============================================
    sovereign: {
        id: 'sovereign',
        name: 'Sovereign',
        description: 'Royal purple with gold accents',
        fonts: {
            primary: '"DM Sans", sans-serif',
            display: '"Manrope", "DM Sans", sans-serif',
            mono: '"JetBrains Mono", monospace',
            url: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
        },
        borderRadius: '16px',
        preview: {
            primary: '#7C3AED',
            secondary: '#D4AF37',
            darkBg: '#0B0B15',
            lightBg: '#EEF0FF',
        },
        dark: {
            colors: {
                primary: '#7C3AED',
                primaryForeground: '#ffffff',
                primaryHover: '#8B5CF6',
                primaryGlow: 'rgba(124, 58, 237, 0.4)',

                secondary: '#D4AF37',
                secondaryForeground: '#0B0B15',

                // Deep indigo-tinted surfaces
                surface0: '#050510',
                surface50: '#0B0B18',
                surface100: '#121228',
                surface200: '#181834',
                surface300: '#252550',
                surface400: '#353565',
                surface500: '#555585',
                surface600: '#7878A8',
                surface700: '#A0A0D0',
                surface800: '#D0D0F0',
                surface900: '#FFFFFF',

                success: '#10B981',
                successGlow: 'rgba(16, 185, 129, 0.3)',
                warning: '#F59E0B',
                warningGlow: 'rgba(245, 158, 11, 0.3)',
                error: '#EF4444',
                errorGlow: 'rgba(239, 68, 68, 0.3)',
                info: '#3B82F6',
                infoGlow: 'rgba(59, 130, 246, 0.3)',

                gradientPrimary: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
                gradientSecondary: 'linear-gradient(135deg, #D4AF37 0%, #F4C430 100%)',
                gradientAccent: 'linear-gradient(135deg, #7C3AED 0%, #D4AF37 100%)',
            },
        },
        light: {
            colors: {
                primary: '#6D28D9',
                primaryForeground: '#FFFFFF',
                primaryHover: '#5B21B6',
                primaryGlow: 'rgba(109, 40, 217, 0.15)',

                secondary: '#B45309',
                secondaryForeground: '#FFFFFF',

                // Cool indigo-slate tinted surfaces
                surface0: '#E8EAFE',
                surface50: '#EEF0FF',
                surface100: '#F8F8FF',
                surface200: '#F0F1FE',
                surface300: '#D0D3EE',
                surface400: '#B0B5D8',
                surface500: '#8088B8',
                surface600: '#606892',
                surface700: '#3E4570',
                surface800: '#1E2350',
                surface900: '#0E1235',

                success: '#059669',
                successGlow: 'none',
                warning: '#D97706',
                warningGlow: 'none',
                error: '#DC2626',
                errorGlow: 'none',
                info: '#2563EB',
                infoGlow: 'none',

                gradientPrimary: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
                gradientSecondary: 'linear-gradient(135deg, #B45309 0%, #92400E 100%)',
                gradientAccent: 'linear-gradient(135deg, #6D28D9 0%, #B45309 100%)',
            },
        },
    },

    // ============================================
    // OPERATOR — Neural Terminal (Cyan + Acid Green)
    // Font: Space Grotesk (body/heading) + Fira Code (mono)
    // Radius: 2px · Teal-tinted surfaces
    // ============================================
    operator: {
        id: 'operator',
        name: 'Operator',
        description: 'Neural interface, bioluminescent',
        fonts: {
            primary: '"Space Grotesk", sans-serif',
            display: '"Space Grotesk", sans-serif',
            mono: '"Fira Code", "Space Mono", monospace',
            url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap',
        },
        borderRadius: '2px',
        preview: {
            primary: '#00EAFF',
            secondary: '#CCFF00',
            darkBg: '#000000',
            lightBg: '#E4F0F0',
        },
        dark: {
            colors: {
                primary: '#00EAFF',
                primaryForeground: '#000000',
                primaryHover: '#33EEFF',
                primaryGlow: 'rgba(0, 234, 255, 0.6)',

                secondary: '#CCFF00',
                secondaryForeground: '#000000',

                // Dark teal-tinted surfaces
                surface0: '#000000',
                surface50: '#040808',
                surface100: '#0A1010',
                surface200: '#0F1818',
                surface300: '#1A2828',
                surface400: '#283838',
                surface500: '#405050',
                surface600: '#607070',
                surface700: '#90A8A8',
                surface800: '#C0D8D8',
                surface900: '#E0F7FA',

                success: '#00FF41',
                successGlow: 'rgba(0, 255, 65, 0.4)',
                warning: '#FFF000',
                warningGlow: 'rgba(255, 240, 0, 0.4)',
                error: '#FF0033',
                errorGlow: 'rgba(255, 0, 51, 0.4)',
                info: '#00EAFF',
                infoGlow: 'rgba(0, 234, 255, 0.4)',

                gradientPrimary: 'linear-gradient(135deg, #00EAFF 0%, #00B8CC 100%)',
                gradientSecondary: 'linear-gradient(135deg, #CCFF00 0%, #88CC00 100%)',
                gradientAccent: 'linear-gradient(135deg, #00EAFF 0%, #CCFF00 100%)',
            },
        },
        light: {
            colors: {
                primary: '#007A85',
                primaryForeground: '#FFFFFF',
                primaryHover: '#00656E',
                primaryGlow: 'rgba(0, 122, 133, 0.15)',

                secondary: '#5A8C00',
                secondaryForeground: '#FFFFFF',

                // Cool teal/mint tinted surfaces
                surface0: '#D8E8E8',
                surface50: '#E4F0F0',
                surface100: '#F0F8F8',
                surface200: '#E8F2F2',
                surface300: '#B8D0D0',
                surface400: '#90B0B0',
                surface500: '#608888',
                surface600: '#406868',
                surface700: '#2A5050',
                surface800: '#183838',
                surface900: '#0A2828',

                success: '#008025',
                successGlow: 'none',
                warning: '#A87D00',
                warningGlow: 'none',
                error: '#B80020',
                errorGlow: 'none',
                info: '#007A85',
                infoGlow: 'none',

                gradientPrimary: 'linear-gradient(135deg, #007A85 0%, #005E68 100%)',
                gradientSecondary: 'linear-gradient(135deg, #5A8C00 0%, #487000 100%)',
                gradientAccent: 'linear-gradient(135deg, #007A85 0%, #5A8C00 100%)',
            },
        },
    },
};

export const themeList = Object.values(themes);
export const defaultTheme: ThemeId = 'origin';
export const defaultMode: ThemeMode = 'dark';

// Generate CSS variables from theme + mode
export function getThemeCSSVariables(theme: Theme, mode: ThemeMode): Record<string, string> {
    const variant = mode === 'dark' ? theme.dark : theme.light;
    const c = variant.colors;

    return {
        // Fonts
        '--font-primary': theme.fonts.primary,
        '--font-display': theme.fonts.display,
        '--font-mono': theme.fonts.mono,

        // Border radius
        '--radius': theme.borderRadius,

        // Colors
        '--primary': c.primary,
        '--primary-foreground': c.primaryForeground,
        '--primary-hover': c.primaryHover,
        '--primary-glow': c.primaryGlow,

        '--secondary': c.secondary,
        '--secondary-foreground': c.secondaryForeground,

        '--surface-0': c.surface0,
        '--surface-50': c.surface50,
        '--surface-100': c.surface100,
        '--surface-200': c.surface200,
        '--surface-300': c.surface300,
        '--surface-400': c.surface400,
        '--surface-500': c.surface500,
        '--surface-600': c.surface600,
        '--surface-700': c.surface700,
        '--surface-800': c.surface800,
        '--surface-900': c.surface900,

        '--success': c.success,
        '--success-glow': c.successGlow,
        '--warning': c.warning,
        '--warning-glow': c.warningGlow,
        '--error': c.error,
        '--error-glow': c.errorGlow,
        '--info': c.info,
        '--info-glow': c.infoGlow,

        '--gradient-primary': c.gradientPrimary,
        '--gradient-secondary': c.gradientSecondary,
        '--gradient-accent': c.gradientAccent,
    };
}
