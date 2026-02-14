"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

// Mock data for the chart
const data = [
    { name: "Jan", users: 400, revenue: 2400, aiCalls: 24000 },
    { name: "Feb", users: 520, revenue: 3200, aiCalls: 32000 },
    { name: "Mar", users: 680, revenue: 4100, aiCalls: 41000 },
    { name: "Apr", users: 790, revenue: 4800, aiCalls: 48000 },
    { name: "May", users: 920, revenue: 5600, aiCalls: 56000 },
    { name: "Jun", users: 1100, revenue: 6800, aiCalls: 68000 },
    { name: "Jul", users: 1247, revenue: 7900, aiCalls: 79000 },
];

export function UsageChart() {
    return (
        <div className="card p-5">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-semibold text-surface-900">Platform Growth</h3>
                    <p className="text-sm text-surface-500 mt-1">Users and revenue over time</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-brand-500" />
                        <span className="text-sm text-surface-600">Users</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-success" />
                        <span className="text-sm text-surface-600">Revenue</span>
                    </div>
                </div>
            </div>

            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#71717a", fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#71717a", fontSize: 12 }}
                            tickFormatter={(value) => `${value >= 1000 ? `${value / 1000}k` : value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: "#18181b",
                                border: "1px solid #3f3f46",
                                borderRadius: "12px",
                                padding: "12px",
                            }}
                            labelStyle={{ color: "#fafafa", fontWeight: 600, marginBottom: 8 }}
                            itemStyle={{ color: "#a1a1aa" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="users"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorUsers)"
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#34d399"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
