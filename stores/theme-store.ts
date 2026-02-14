import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ThemeId, type ThemeMode, themes, defaultTheme, defaultMode, getThemeCSSVariables } from '@/lib/themes';

interface ThemeState {
    themeId: ThemeId;
    mode: ThemeMode;
    setTheme: (themeId: ThemeId) => void;
    setMode: (mode: ThemeMode) => void;
    toggleMode: () => void;
    applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            themeId: defaultTheme,
            mode: defaultMode,

            setTheme: (themeId: ThemeId) => {
                set({ themeId });
                get().applyTheme();
            },

            setMode: (mode: ThemeMode) => {
                set({ mode });
                get().applyTheme();
            },

            toggleMode: () => {
                const newMode = get().mode === 'dark' ? 'light' : 'dark';
                set({ mode: newMode });
                get().applyTheme();
            },

            applyTheme: () => {
                const { themeId, mode } = get();
                const theme = themes[themeId];

                if (typeof window === 'undefined') return;

                const root = document.documentElement;
                const variables = getThemeCSSVariables(theme, mode);

                Object.entries(variables).forEach(([key, value]) => {
                    root.style.setProperty(key, value);
                });

                // Set data attributes for CSS selectors
                root.setAttribute('data-theme', themeId);
                root.setAttribute('data-mode', mode);

                // Update meta theme-color
                const meta = document.querySelector('meta[name="theme-color"]');
                if (meta) {
                    meta.setAttribute('content', mode === 'dark' ? theme.dark.colors.surface0 : theme.light.colors.surface0);
                }

                // Load theme font
                const existingFont = document.getElementById('theme-font');
                if (existingFont) existingFont.remove();
                const link = document.createElement('link');
                link.id = 'theme-font';
                link.href = theme.fonts.url;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            },
        }),
        {
            name: 'oraya-theme-storage',
            partialize: (state) => ({ themeId: state.themeId, mode: state.mode }),
        }
    )
);

// Initialize theme on client
export function initializeTheme() {
    if (typeof window === 'undefined') return;
    useThemeStore.getState().applyTheme();
}
