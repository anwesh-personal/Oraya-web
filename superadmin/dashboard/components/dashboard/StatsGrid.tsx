"use client";

import {
    Users,
    UserCheck,
    Bot,
    Key,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Zap,
} from "lucide-react";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";

interface StatsGridProps {
    stats: {
        totalUsers: number;
        activeUsers: number;
        totalAgents: number;
        totalLicenses: number;
    };
}

export function StatsGrid({ stats }: StatsGridProps) {
    const statCards = [
        {
            title: "Total Users",
            value: formatNumber(stats.totalUsers || 1247),
            change: "+12.5%",
            trend: "up" as const,
            icon: Users,
            color: "from-brand-500 to-brand-600",
            bgColor: "bg-brand-500/10",
            textColor: "text-brand-400",
        },
        {
            title: "Active Licenses",
            value: formatNumber(stats.activeUsers || 983),
            change: "+8.2%",
            trend: "up" as const,
            icon: UserCheck,
            color: "from-emerald-500 to-emerald-600",
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-400",
        },
        {
            title: "AI Providers",
            value: formatNumber(stats.totalAgents || 12),
            change: "+2",
            trend: "up" as const,
            icon: Zap,
            color: "from-amber-500 to-amber-600",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-400",
        },
        {
            title: "Monthly Revenue",
            value: formatCurrency(24580),
            change: "+18.3%",
            trend: "up" as const,
            icon: DollarSign,
            color: "from-cyan-500 to-cyan-600",
            bgColor: "bg-cyan-500/10",
            textColor: "text-cyan-400",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
                <div
                    key={stat.title}
                    className={cn(
                        "card p-5 hover-lift",
                        `stagger-${index + 1}`
                    )}
                    style={{ animationFillMode: "backwards" }}
                >
                    <div className="flex items-start justify-between">
                        <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                            <stat.icon className={cn("w-5 h-5", stat.textColor)} />
                        </div>
                        <div
                            className={cn(
                                "flex items-center gap-1 text-xs font-medium",
                                stat.trend === "up" ? "text-emerald-400" : "text-rose-400"
                            )}
                        >
                            {stat.trend === "up" ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {stat.change}
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm text-surface-500">{stat.title}</p>
                        <p className="text-2xl font-bold text-surface-900 mt-1">
                            {stat.value}
                        </p>
                    </div>

                    {/* Progress bar (decorative) */}
                    <div className="mt-4 h-1 bg-surface-200 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full bg-gradient-to-r rounded-full transition-all duration-1000",
                                stat.color
                            )}
                            style={{ width: `${60 + index * 10}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
