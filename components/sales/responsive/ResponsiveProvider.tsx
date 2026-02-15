"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ResponsiveContextType {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
});

export const useResponsive = () => useContext(ResponsiveContext);

export function ResponsiveProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ResponsiveContextType>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
    });

    useEffect(() => {
        const updateMedia = () => {
            const width = window.innerWidth;
            setState({
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isDesktop: width >= 1024,
            });
        };

        updateMedia();
        window.addEventListener("resize", updateMedia);
        return () => window.removeEventListener("resize", updateMedia);
    }, []);

    return (
        <ResponsiveContext.Provider value={state}>
            {children}
        </ResponsiveContext.Provider>
    );
}

export function MobileOnly({ children }: { children: React.ReactNode }) {
    const { isMobile } = useResponsive();
    if (!isMobile) return null;
    return <>{children}</>;
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
    const { isDesktop } = useResponsive();
    if (!isDesktop) return null;
    return <>{children}</>;
}
