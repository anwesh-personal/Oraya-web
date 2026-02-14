import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes with clsx
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format number with abbreviations (1.2K, 3.4M)
export function formatNumber(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
}

// Format currency
export function formatCurrency(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

// Format percentage
export function formatPercent(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`;
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Format date relative (2 hours ago, Yesterday, etc.)
export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return target.toLocaleDateString();
}

// Format date to readable string
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...options,
    });
}

// Format datetime
export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
}

// Generate random ID
export function generateId(length = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
}

// Delay utility
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

// Get initials from name
export function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Status color mapping
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        active: "text-emerald-400",
        healthy: "text-emerald-400",
        online: "text-emerald-400",
        success: "text-emerald-400",
        pending: "text-amber-400",
        warning: "text-amber-400",
        trial: "text-amber-400",
        inactive: "text-zinc-500",
        offline: "text-zinc-500",
        suspended: "text-rose-400",
        error: "text-rose-400",
        cancelled: "text-rose-400",
        expired: "text-rose-400",
    };
    return colors[status.toLowerCase()] || "text-zinc-400";
}

// Status badge color mapping
export function getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
        active: "badge-success",
        healthy: "badge-success",
        online: "badge-success",
        success: "badge-success",
        pending: "badge-warning",
        warning: "badge-warning",
        trial: "badge-warning",
        inactive: "badge",
        offline: "badge",
        suspended: "badge-error",
        error: "badge-error",
        cancelled: "badge-error",
        expired: "badge-error",
    };
    return classes[status.toLowerCase()] || "badge";
}
