"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabItem {
    id: string | number;
    label: React.ReactNode;
}

interface HorizontalScrollTabsProps {
    items: TabItem[];
    activeId: string | number;
    onChange: (id: string | number) => void;
    className?: string;
    tabClassName?: string;
    activeTabClassName?: string;
    showIndicator?: boolean;
    indicatorColor?: string;
}

export function HorizontalScrollTabs({
    items,
    activeId,
    onChange,
    className,
    tabClassName,
    activeTabClassName,
    showIndicator = true,
    indicatorColor = "var(--primary)"
}: HorizontalScrollTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLButtonElement>(null);

    // Scroll active tab into view
    useEffect(() => {
        if (activeRef.current && scrollRef.current) {
            const container = scrollRef.current;
            const tab = activeRef.current;

            const tabLeft = tab.offsetLeft;
            const tabWidth = tab.offsetWidth;
            const containerScrollLeft = container.scrollLeft;
            const containerWidth = container.offsetWidth;

            if (tabLeft < containerScrollLeft) {
                container.scrollTo({ left: tabLeft - 20, behavior: 'smooth' });
            } else if (tabLeft + tabWidth > containerScrollLeft + containerWidth) {
                container.scrollTo({ left: tabLeft + tabWidth - containerWidth + 20, behavior: 'smooth' });
            }
        }
    }, [activeId]);

    return (
        <div
            ref={scrollRef}
            className={cn(
                "flex overflow-x-auto no-scrollbar gap-2 pb-4 -mb-4 px-4 snap-x",
                className
            )}
        >
            {items.map((item) => {
                const isActive = item.id === activeId;
                return (
                    <button
                        key={item.id}
                        ref={isActive ? activeRef : null}
                        onClick={() => onChange(item.id)}
                        className={cn(
                            "relative shrink-0 flex items-center gap-3 px-6 py-3 rounded-full border font-mono text-[10px] font-black uppercase tracking-widest transition-all duration-500 snap-center",
                            isActive
                                ? "bg-white/[0.05] border-white/20 text-white shadow-xl"
                                : "bg-white/[0.02] border-white/5 text-zinc-500 hover:text-zinc-400",
                            tabClassName,
                            isActive && activeTabClassName
                        )}
                    >
                        {item.label}
                        {isActive && showIndicator && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute bottom-0 left-4 right-4 h-[2px]"
                                style={{ background: indicatorColor }}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
