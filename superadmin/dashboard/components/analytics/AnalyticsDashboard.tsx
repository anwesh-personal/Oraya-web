"use client";

import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface AnalyticsData {
    stats: {
        totalUsers: number;
        activeSubscriptions: number;
        mrr: number;
        totalTokens: number;
        growth: number;
        churn: number;
    };
    revenueByMonth: { month: string; revenue: number }[];
    usersByTier: { tier: string; count: number; color: string }[];
    topFeatures: { name: string; usage: number }[];
}

interface AnalyticsDashboardProps {
    data: AnalyticsData;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-6">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.revenueByMonth}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                borderRadius: "12px",
                            }}
                            labelStyle={{ color: "#fff" }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Users by Tier */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-6">Users by Tier</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data.usersByTier}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="tier"
                        >
                            {data.usersByTier.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                borderRadius: "12px",
                            }}
                            formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                        />
                        <Legend
                            formatter={(value) => <span className="text-gray-300">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Feature Usage */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-6">Top Features by Usage</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.topFeatures} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9ca3af" tickFormatter={(value) => `${value / 1000}k`} />
                        <YAxis type="category" dataKey="name" stroke="#9ca3af" width={100} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                borderRadius: "12px",
                            }}
                            formatter={(value: number) => [value.toLocaleString(), "Usage"]}
                        />
                        <Bar dataKey="usage" fill="#06b6d4" radius={[0, 8, 8, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
