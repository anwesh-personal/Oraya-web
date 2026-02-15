"use client";

import React from "react";
import { useResponsive } from "./ResponsiveProvider";

interface ResponsiveSwitcherProps {
    mobile: React.ReactNode;
    desktop: React.ReactNode;
    tablet?: React.ReactNode;
}

/**
 * Switcher that renders different components based on screen size.
 * Uses the ResponsiveProvider context for consistent media query handling.
 */
export function ResponsiveSwitcher({ mobile, desktop, tablet }: ResponsiveSwitcherProps) {
    const { isMobile, isTablet, isDesktop } = useResponsive();

    if (isMobile) return <>{mobile}</>;
    if (isTablet && tablet) return <>{tablet}</>;
    return <>{desktop}</>;
}

interface ResponsiveGridProps {
    children: React.ReactNode;
    mobileCols?: number | string;
    tabletCols?: number | string;
    desktopCols?: number | string;
    gap?: string | number;
    className?: string;
}

/**
 * A simpler responsive grid helper
 */
export function ResponsiveGrid({
    children,
    mobileCols = 1,
    tabletCols = 2,
    desktopCols = 3,
    gap = 8,
    className
}: ResponsiveGridProps) {
    return (
        <div
            className={className}
            style={{
                display: 'grid',
                gap: typeof gap === 'number' ? `${gap * 0.25}rem` : gap,
                gridTemplateColumns: `repeat(var(--cols, ${desktopCols}), minmax(0, 1fr))`
            } as any}
        >
            <style jsx>{`
                div { --cols: ${mobileCols}; }
                @media (min-width: 768px) { div { --cols: ${tabletCols}; } }
                @media (min-width: 1024px) { div { --cols: ${desktopCols}; } }
            `}</style>
            {children}
        </div>
    );
}
