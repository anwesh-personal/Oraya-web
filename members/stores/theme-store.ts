import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ThemeId, themes, defaultTheme, getThemeCSSVariables } from '@/lib/themes';

interface ThemeState {
    themeId: ThemeId;
    setTheme: (themeId: ThemeId) => void;
    applyTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            themeId: defaultTheme,

            setTheme: (themeId: ThemeId) => {
                set({ themeId });
                // Apply immediately
                get().applyTheme();
            },

            applyTheme: () => {
                const { themeId } = get();
                const theme = themes[themeId];

                if (typeof window === 'undefined') return;

                const root = document.documentElement;
                const variables = getThemeCSSVariables(theme);

                Object.entries(variables).forEach(([key, value]) => {
                    root.style.setProperty(key, value);
                });

                // Update meta theme-color
                const meta = document.querySelector('meta[name="theme-color"]');
                if (meta) {
                    meta.setAttribute('content', theme.colors.surface0);
                }

                // Store in localStorage for SSR hydration
                localStorage.setItem('oraya-theme-id', themeId);
            },
        }),
        {
            name: 'oraya-theme-storage',
            partialize: (state) => ({ themeId: state.themeId }),
        }
    )
);

// Initialize theme on client
export function initializeTheme() {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('oraya-theme-id') as ThemeId | null;
    const themeId = stored && themes[stored] ? stored : defaultTheme;

    useThemeStore.getState().setTheme(themeId);
}
