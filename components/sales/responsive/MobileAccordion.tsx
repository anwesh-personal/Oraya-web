"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AccordionItem {
    id: string | number;
    trigger: React.ReactNode;
    content: React.ReactNode;
}

interface MobileAccordionProps {
    items: AccordionItem[];
    activeId?: string | number;
    onChange?: (id: string | number) => void;
    className?: string;
    itemClassName?: string;
    triggerClassName?: string;
    contentClassName?: string;
}

export function MobileAccordion({
    items,
    activeId: externalActiveId,
    onChange,
    className,
    itemClassName,
    triggerClassName,
    contentClassName
}: MobileAccordionProps) {
    const [internalActiveId, setInternalActiveId] = useState<string | number | null>(null);

    const activeId = externalActiveId !== undefined ? externalActiveId : internalActiveId;
    const setActiveId = (id: string | number) => {
        if (id === activeId) {
            if (externalActiveId === undefined) setInternalActiveId(null);
            if (onChange) onChange(null as any);
        } else {
            if (externalActiveId === undefined) setInternalActiveId(id);
            if (onChange) onChange(id);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        "rounded-[32px] border transition-all duration-500 overflow-hidden",
                        activeId === item.id ? "bg-white/[0.04] border-white/20" : "bg-white/[0.01] border-white/5",
                        itemClassName
                    )}
                >
                    <button
                        onClick={() => setActiveId(item.id)}
                        className={cn(
                            "w-full px-6 py-5 flex items-center justify-between text-left",
                            triggerClassName
                        )}
                    >
                        <div className="flex-1">{item.trigger}</div>
                        <motion.div
                            animate={{ rotate: activeId === item.id ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-4 text-zinc-500"
                        >
                            <ChevronDown size={20} />
                        </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                        {activeId === item.id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                            >
                                <div className={cn("px-6 pb-6", contentClassName)}>
                                    {item.content}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
}
