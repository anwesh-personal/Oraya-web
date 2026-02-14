// ============================================
// ORAYA SUPERADMIN THEME SYSTEM
// 5 Premium Themes - Enterprise Grade
// ============================================

export type ThemeId = 'midnight' | 'obsidian' | 'aurora' | 'sunset' | 'ocean';

export interface Theme {
    id: ThemeId;
    name: string;
    description: string;
    preview: {
        primary: string;
        secondary: string;
        background: string;
    };
    colors: {
        // Primary brand
        primary: string;
        primaryForeground: string;
        primaryHover: string;
        primaryGlow: string;

        // Secondary accent
        secondary: string;
        secondaryForeground: string;

        // Surfaces (dark to light)
        surface0: string;   // Deepest background
        surface50: string;  // Main background
        surface100: string; // Cards
        surface200: string; // Elevated cards
        surface300: string; // Borders
        surface400: string; // Muted borders
        surface500: string; // Disabled
        surface600: string; // Muted text
        surface700: string; // Secondary text
        surface800: string; // Primary text
        surface900: string; // Brightest text

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
    };
}

export const themes: Record<ThemeId, Theme> = {
    // ============================================
    // MIDNIGHT - Deep violet elegance
    // ============================================
    midnight: {
        id: 'midnight',
        name: 'Midnight',
        description: 'Deep violet elegance with electric accents',
        preview: {
            primary: '#8b5cf6',
            secondary: '#22d3ee',
            background: '#0a0a0f',
        },
        colors: {
            primary: '#8b5cf6',
            primaryForeground: '#ffffff',
            primaryHover: '#a78bfa',
            primaryGlow: 'rgba(139, 92, 246, 0.4)',

            secondary: '#22d3ee',
            secondaryForeground: '#ffffff',

            surface0: '#05050a',
            surface50: '#0a0a0f',
            surface100: '#111118',
            surface200: '#1a1a24',
            surface300: '#252532',
            surface400: '#3a3a4a',
            surface500: '#52526b',
            surface600: '#71718f',
            surface700: '#a1a1bd',
            surface800: '#d4d4e8',
            surface900: '#fafaff',

            success: '#34d399',
            successGlow: 'rgba(52, 211, 153, 0.4)',
            warning: '#fbbf24',
            warningGlow: 'rgba(251, 191, 36, 0.4)',
            error: '#f87171',
            errorGlow: 'rgba(248, 113, 113, 0.4)',
            info: '#22d3ee',
            infoGlow: 'rgba(34, 211, 238, 0.4)',

            gradientPrimary: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            gradientSecondary: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
            gradientAccent: 'linear-gradient(135deg, #8b5cf6 0%, #22d3ee 100%)',
        },
    },

    // ============================================
    // OBSIDIAN - Pure black sophistication
    // ============================================
    obsidian: {
        id: 'obsidian',
        name: 'Obsidian',
        description: 'Pure black sophistication with silver accents',
        preview: {
            primary: '#a1a1aa',
            secondary: '#71717a',
            background: '#000000',
        },
        colors: {
            primary: '#e4e4e7',
            primaryForeground: '#09090b',
            primaryHover: '#f4f4f5',
            primaryGlow: 'rgba(228, 228, 231, 0.3)',

            secondary: '#a1a1aa',
            secondaryForeground: '#09090b',

            surface0: '#000000',
            surface50: '#09090b',
            surface100: '#0f0f10',
            surface200: '#171718',
            surface300: '#1f1f21',
            surface400: '#2e2e31',
            surface500: '#3f3f42',
            surface600: '#52525b',
            surface700: '#71717a',
            surface800: '#a1a1aa',
            surface900: '#fafafa',

            success: '#4ade80',
            successGlow: 'rgba(74, 222, 128, 0.3)',
            warning: '#facc15',
            warningGlow: 'rgba(250, 204, 21, 0.3)',
            error: '#f87171',
            errorGlow: 'rgba(248, 113, 113, 0.3)',
            info: '#60a5fa',
            infoGlow: 'rgba(96, 165, 250, 0.3)',

            gradientPrimary: 'linear-gradient(135deg, #e4e4e7 0%, #a1a1aa 100%)',
            gradientSecondary: 'linear-gradient(135deg, #71717a 0%, #52525b 100%)',
            gradientAccent: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
        },
    },

    // ============================================
    // AURORA - Neon cyberpunk vibes
    // ============================================
    aurora: {
        id: 'aurora',
        name: 'Aurora',
        description: 'Neon cyberpunk with electric green & pink',
        preview: {
            primary: '#10b981',
            secondary: '#ec4899',
            background: '#0a0f0d',
        },
        colors: {
            primary: '#10b981',
            primaryForeground: '#ffffff',
            primaryHover: '#34d399',
            primaryGlow: 'rgba(16, 185, 129, 0.5)',

            secondary: '#ec4899',
            secondaryForeground: '#ffffff',

            surface0: '#050a08',
            surface50: '#0a0f0d',
            surface100: '#101916',
            surface200: '#182420',
            surface300: '#22322c',
            surface400: '#2d4038',
            surface500: '#3d5249',
            surface600: '#5a7269',
            surface700: '#8ba399',
            surface800: '#c4d4cd',
            surface900: '#f0f7f4',

            success: '#10b981',
            successGlow: 'rgba(16, 185, 129, 0.5)',
            warning: '#f59e0b',
            warningGlow: 'rgba(245, 158, 11, 0.4)',
            error: '#ef4444',
            errorGlow: 'rgba(239, 68, 68, 0.4)',
            info: '#06b6d4',
            infoGlow: 'rgba(6, 182, 212, 0.4)',

            gradientPrimary: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            gradientSecondary: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            gradientAccent: 'linear-gradient(135deg, #10b981 0%, #ec4899 100%)',
        },
    },

    // ============================================
    // SUNSET - Warm amber luxury
    // ============================================
    sunset: {
        id: 'sunset',
        name: 'Sunset',
        description: 'Warm amber luxury with golden highlights',
        preview: {
            primary: '#f59e0b',
            secondary: '#ef4444',
            background: '#0f0a05',
        },
        colors: {
            primary: '#f59e0b',
            primaryForeground: '#0f0a05',
            primaryHover: '#fbbf24',
            primaryGlow: 'rgba(245, 158, 11, 0.5)',

            secondary: '#ef4444',
            secondaryForeground: '#ffffff',

            surface0: '#080502',
            surface50: '#0f0a05',
            surface100: '#1a140a',
            surface200: '#261e10',
            surface300: '#352a18',
            surface400: '#4a3a22',
            surface500: '#614c2e',
            surface600: '#8a6d42',
            surface700: '#b8956a',
            surface800: '#dcc4a0',
            surface900: '#faf6f0',

            success: '#84cc16',
            successGlow: 'rgba(132, 204, 22, 0.4)',
            warning: '#f59e0b',
            warningGlow: 'rgba(245, 158, 11, 0.5)',
            error: '#ef4444',
            errorGlow: 'rgba(239, 68, 68, 0.4)',
            info: '#0ea5e9',
            infoGlow: 'rgba(14, 165, 233, 0.4)',

            gradientPrimary: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            gradientSecondary: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            gradientAccent: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        },
    },

    // ============================================
    // OCEAN - Deep blue tranquility
    // ============================================
    ocean: {
        id: 'ocean',
        name: 'Ocean',
        description: 'Deep blue tranquility with cyan waves',
        preview: {
            primary: '#0ea5e9',
            secondary: '#06b6d4',
            background: '#050a10',
        },
        colors: {
            primary: '#0ea5e9',
            primaryForeground: '#ffffff',
            primaryHover: '#38bdf8',
            primaryGlow: 'rgba(14, 165, 233, 0.5)',

            secondary: '#06b6d4',
            secondaryForeground: '#ffffff',

            surface0: '#020508',
            surface50: '#050a10',
            surface100: '#0a1420',
            surface200: '#0f1f30',
            surface300: '#152b42',
            surface400: '#1e3a54',
            surface500: '#2d4f6e',
            surface600: '#4a7194',
            surface700: '#7ba3c4',
            surface800: '#b4d0e8',
            surface900: '#f0f7fc',

            success: '#22c55e',
            successGlow: 'rgba(34, 197, 94, 0.4)',
            warning: '#eab308',
            warningGlow: 'rgba(234, 179, 8, 0.4)',
            error: '#f43f5e',
            errorGlow: 'rgba(244, 63, 94, 0.4)',
            info: '#06b6d4',
            infoGlow: 'rgba(6, 182, 212, 0.5)',

            gradientPrimary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            gradientSecondary: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            gradientAccent: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
        },
    },
};

export const themeList = Object.values(themes);
export const defaultTheme: ThemeId = 'midnight';

// Generate CSS variables from theme
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
    return {
        '--primary': theme.colors.primary,
        '--primary-foreground': theme.colors.primaryForeground,
        '--primary-hover': theme.colors.primaryHover,
        '--primary-glow': theme.colors.primaryGlow,

        '--secondary': theme.colors.secondary,
        '--secondary-foreground': theme.colors.secondaryForeground,

        '--surface-0': theme.colors.surface0,
        '--surface-50': theme.colors.surface50,
        '--surface-100': theme.colors.surface100,
        '--surface-200': theme.colors.surface200,
        '--surface-300': theme.colors.surface300,
        '--surface-400': theme.colors.surface400,
        '--surface-500': theme.colors.surface500,
        '--surface-600': theme.colors.surface600,
        '--surface-700': theme.colors.surface700,
        '--surface-800': theme.colors.surface800,
        '--surface-900': theme.colors.surface900,

        '--success': theme.colors.success,
        '--success-glow': theme.colors.successGlow,
        '--warning': theme.colors.warning,
        '--warning-glow': theme.colors.warningGlow,
        '--error': theme.colors.error,
        '--error-glow': theme.colors.errorGlow,
        '--info': theme.colors.info,
        '--info-glow': theme.colors.infoGlow,

        '--gradient-primary': theme.colors.gradientPrimary,
        '--gradient-secondary': theme.colors.gradientSecondary,
        '--gradient-accent': theme.colors.gradientAccent,
    };
}
