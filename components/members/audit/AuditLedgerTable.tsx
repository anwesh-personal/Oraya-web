"use client";

// ============================================================================
// AuditLedgerTable — Paginated, Filterable Attestation Ledger
// ============================================================================
// Queries /api/asis/attestations with real-time search, model filter,
// status filter, and pagination. Model dropdown populated from API —
// never hardcoded. Full theme system compliance.
// ============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
    Search,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Filter,
} from "lucide-react";
import type { AttestationRecord, HonestyState, PaginationMeta } from "./types";
import {
    DEFAULT_HONESTY,
    deriveProofStatus,
    isMockOrOffline,
    proofStatusLabel,
    proofStatusVariant,
} from "@/lib/asis-honesty";

interface AuditLedgerTableProps {
    /** Available model IDs for filter dropdown (fetched from managed_ai_keys) */
    availableModels: string[];
    honesty?: HonestyState;
}

export function AuditLedgerTable({ availableModels, honesty = DEFAULT_HONESTY }: AuditLedgerTableProps) {
    const [records, setRecords] = useState<AttestationRecord[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [modelFilter, setModelFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(25);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchAttestations = useCallback(async (
        page: number,
        search: string,
        model: string,
        status: string,
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", String(pageSize));
            if (search) params.set("search", search);
            if (model) params.set("model_id", model);
            if (status) params.set("status", status);

            const res = await fetch(`/api/asis/attestations?${params.toString()}`);
            if (res.ok) {
                const body = await res.json();
                setRecords(body.data?.attestations ?? []);
                setPagination(body.data?.pagination ?? null);
            } else {
                setRecords([]);
                setPagination(null);
            }
        } catch {
            setRecords([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    // Initial load
    useEffect(() => {
        fetchAttestations(1, "", "", "");
    }, [fetchAttestations]);

    // Debounced search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchAttestations(1, value, modelFilter, statusFilter);
        }, 350);
    };

    // Filter changes
    const handleModelChange = (value: string) => {
        setModelFilter(value);
        setCurrentPage(1);
        fetchAttestations(1, searchQuery, value, statusFilter);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
        fetchAttestations(1, searchQuery, modelFilter, value);
    };

    // Pagination
    const goToPage = (page: number) => {
        setCurrentPage(page);
        fetchAttestations(page, searchQuery, modelFilter, statusFilter);
    };

    const formatTimestamp = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    const variantColor: Record<ReturnType<typeof proofStatusVariant>, string> = {
        ok: "var(--success)",
        accent: "var(--info)",
        err: "var(--error)",
        muted: "var(--surface-500)",
        warn: "var(--warning)",
    };

    const StatusBadge = ({ record }: { record: AttestationRecord }) => {
        const derived = deriveProofStatus(record, honesty);
        const label = proofStatusLabel(derived);
        const color = variantColor[proofStatusVariant(derived)];
        const Icon = derived === "verified"
            ? CheckCircle2
            : derived === "invalid"
                ? XCircle
                : Clock;
        return (
            <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{
                    backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                    borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                    color,
                }}
            >
                <Icon className="w-3 h-3" />
                {label}
            </span>
        );
    };

    const mockish = isMockOrOffline(honesty.proverMode) || !honesty.engineReachable;

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[var(--surface-400)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search by hash, model, or attestation ID..."
                        value={searchQuery}
                        onChange={e => handleSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-800)] placeholder-[var(--surface-400)] focus:outline-none focus:border-[var(--primary)]/50 transition-all font-mono"
                    />
                </div>

                {/* Model Filter */}
                <select
                    value={modelFilter}
                    onChange={e => handleModelChange(e.target.value)}
                    className="px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                >
                    <option value="">All Models</option>
                    {availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="px-3 py-2 text-sm bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-xl text-[var(--surface-700)] focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                >
                    <option value="">All Statuses</option>
                    <option value="verified_valid">DB: marked valid</option>
                    <option value="verified_invalid">DB: marked invalid</option>
                    <option value="pending">Pending</option>
                    <option value="unattested">Unattested</option>
                </select>

                {/* Record count */}
                <div className="text-xs text-[var(--surface-500)] font-mono whitespace-nowrap self-center">
                    {pagination ? `${pagination.total.toLocaleString()} record${pagination.total !== 1 ? "s" : ""}` : "—"}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-[var(--surface-300)] bg-[var(--surface-50)]">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                    </div>
                ) : records.length === 0 ? (
                    <div className="py-16 text-center">
                        <Filter className="w-8 h-8 text-[var(--surface-400)] mx-auto mb-3" />
                        <p className="text-sm text-[var(--surface-500)]">
                            {searchQuery || modelFilter || statusFilter
                                ? "No attestations match your filters."
                                : "No attestations recorded yet. Attestations are created automatically when inferences are processed through the ASIS engine."}
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--surface-100)] text-[var(--surface-500)] border-b border-[var(--surface-300)] uppercase tracking-wider font-mono text-[11px]">
                            <tr>
                                <th className="p-4">Attestation ID</th>
                                <th className="p-4">Model &amp; Time</th>
                                <th className="p-4">Governance Hash</th>
                                <th className="p-4">{mockish ? "Leaf & Signature" : "Proof & Signature"}</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Verification</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-200)] font-mono">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-[var(--surface-100)]/50 transition-colors">
                                    <td className="p-4 font-semibold text-[var(--primary)]">
                                        {r.id.slice(0, 12)}…
                                    </td>
                                    <td className="p-4">
                                        <div className="text-[var(--surface-800)] font-sans font-medium">{r.model_id}</div>
                                        <div className="text-[var(--surface-500)] text-[10px]">{formatTimestamp(r.created_at)}</div>
                                    </td>
                                    <td className="p-4">
                                        <div
                                            className="text-[var(--surface-700)] font-mono text-[11px] truncate max-w-xs"
                                            title={r.governance_hash}
                                        >
                                            {r.governance_hash}
                                        </div>
                                    </td>
                                    <td className="p-4 space-y-0.5">
                                        <div className="text-[var(--surface-700)] flex items-center gap-1.5">
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                    backgroundColor: mockish || r.zkp_valid !== true
                                                        ? "var(--surface-400)"
                                                        : "var(--success)",
                                                }}
                                            />
                                            {mockish ? "Governance leaf" : "STARK envelope"}
                                        </div>
                                        <div className="text-[var(--surface-500)] flex items-center gap-1.5 text-[10px]">
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{
                                                    backgroundColor: r.pqc_valid ? "var(--info)" : "var(--surface-400)",
                                                }}
                                            />
                                            {r.pqc_algorithm}{r.pqc_valid ? " signed" : " recorded"}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge record={r} />
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/verify/${r.id}`}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--surface-100)] hover:bg-[var(--surface-200)] text-[var(--surface-700)] text-xs font-sans transition-all border border-[var(--surface-300)] hover:border-[var(--surface-400)]"
                                        >
                                            <span>Inspect</span>
                                            <ExternalLink className="w-3 h-3 text-[var(--surface-500)]" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--surface-500)]">
                        Page {pagination.page} of {pagination.total_pages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={!pagination.has_prev}
                            className="p-2 rounded-lg bg-[var(--surface-50)] border border-[var(--surface-300)] text-[var(--surface-600)] hover:bg-[var(--surface-100)] disabled:opacity-40 transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={!pagination.has_next}
                            className="p-2 rounded-lg bg-[var(--surface-50)] border border-[var(--surface-300)] text-[var(--surface-600)] hover:bg-[var(--surface-100)] disabled:opacity-40 transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
