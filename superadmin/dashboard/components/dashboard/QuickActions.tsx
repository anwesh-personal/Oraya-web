"use client";

import { Plus, RefreshCw, Download, Send } from "lucide-react";

export function QuickActions() {
    return (
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-100 border border-surface-300 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-200 transition-colors">
                <RefreshCw className="w-4 h-4" />
                Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-100 border border-surface-300 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-200 transition-colors">
                <Download className="w-4 h-4" />
                Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl text-sm font-medium text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all">
                <Plus className="w-4 h-4" />
                New User
            </button>
        </div>
    );
}
