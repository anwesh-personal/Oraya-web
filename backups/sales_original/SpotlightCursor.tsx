"use client";

import { useEffect, useRef } from "react";

export default function SpotlightCursor() {
    const spotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (spotRef.current) {
                spotRef.current.style.setProperty("--mx", `${e.clientX}px`);
                spotRef.current.style.setProperty("--my", `${e.clientY}px`);
            }
        };
        window.addEventListener("mousemove", handler, { passive: true });
        return () => window.removeEventListener("mousemove", handler);
    }, []);

    return (
        <div
            ref={spotRef}
            className="fixed inset-0 z-[1] pointer-events-none transition-opacity duration-300"
            style={{
                background: `radial-gradient(800px circle at var(--mx, 50%) var(--my, 50%), rgba(0, 240, 255, 0.04), transparent 60%)`,
            }}
        />
    );
}
