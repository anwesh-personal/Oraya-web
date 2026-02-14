"use client";

import { useEffect } from "react";
import { useThemeStore, initializeTheme } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const applyTheme = useThemeStore((state) => state.applyTheme);

    useEffect(() => {
        initializeTheme();
    }, []);

    // Also apply on mount in case store is already hydrated
    useEffect(() => {
        applyTheme();
    }, [applyTheme]);

    return <>{children}</>;
}
