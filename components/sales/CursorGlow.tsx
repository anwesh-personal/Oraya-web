"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionTemplate } from "framer-motion";

export function CursorGlow() {
    const [mounted, setMounted] = useState(false);

    // Smooth trailing effect
    const mouseX = useSpring(0, { stiffness: 500, damping: 50 });
    const mouseY = useSpring(0, { stiffness: 500, damping: 50 });

    const background = useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, var(--primary-glow), transparent 80%)`;

    useEffect(() => {
        setMounted(true);
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    if (!mounted) return null;

    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-[9999] opacity-30 overflow-hidden"
            style={{
                background,
            }}
        >
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none opacity-20"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: "-50%",
                    translateY: "-50%",
                    background: "var(--primary)",
                }}
            />
        </motion.div>
    );
}
