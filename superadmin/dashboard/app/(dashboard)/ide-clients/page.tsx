"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw, Terminal, Layers, BookOpen, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddIDEClientModal } from "@/components/ide-clients/AddIDEClientModal";
import Image from "next/image";

interface IDEClient {
    id: string;
    name: string;
    display_name: string;
    description: string;
    logo_url: string | null;
    docs_url: string | null;
    default_protocols: string[];
    is_active: boolean;
    sync_source: string;
    updated_at: string;
}

export default function IDEClientsPage() {
    const [clients, setClients] = useState<IDEClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, protocols: 0 });

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const token = localStorage.getItem("oraya-superadmin-token");
            const response = await fetch("/api/superadmin/ide-clients", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const fetchedClients = data.clients || [];
                setClients(fetchedClients);

                const active = fetchedClients.filter((c: any) => c.is_active).length;
                const uniqueProtocols = new Set(fetchedClients.flatMap((c: any) => c.default_protocols)).size;
                setStats({ total: fetchedClients.length, active, protocols: uniqueProtocols });
            }
        } catch (error) {
            console.error("Error fetching IDE clients:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem("oraya-superadmin-token");
            await fetch("/api/superadmin/ide-clients", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id,
                    updates: { is_active: !currentStatus },
                }),
            });
            fetchData(true);
        } catch (error) {
            console.error("Failed to toggle status", error);
        }
    };

    const deleteClient = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this IDE client? This will remove it from all users' desktops on next sync.")) return;

        try {
            const token = localStorage.getItem("oraya-superadmin-token");
            await fetch(`/api/superadmin/ide-clients?id=${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            fetchData(true);
        } catch (error) {
            console.error("Failed to delete client", error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">IDE Clients</h1>
                    <p className="text-[var(--surface-600)] mt-1">
                        Manage supported IDEs and code editors across the Oraya network.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchData(true)}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl text-sm font-medium text-[var(--surface-700)] hover:bg-[var(--surface-200)] transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all shadow-lg hover:shadow-xl"
                        style={{
                            background: "var(--gradient-primary)",
                            boxShadow: "0 4px 20px -4px var(--primary-glow)",
                        }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Client
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5 border border-[var(--primary)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--primary)]/20">
                            <Terminal className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Total Clients</p>
                            <p className="text-2xl font-bold text-[var(--surface-900)]">
                                {isLoading ? "—" : stats.total}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--success)]/10 to-[var(--success)]/5 border border-[var(--success)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--success)]/20">
                            <Layers className="w-5 h-5 text-[var(--success)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Active Clients</p>
                            <p className="text-2xl font-bold text-[var(--success)]">
                                {isLoading ? "—" : stats.active}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--secondary)]/10 to-[var(--secondary)]/5 border border-[var(--secondary)]/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[var(--secondary)]/20">
                            <BookOpen className="w-5 h-5 text-[var(--secondary)]" />
                        </div>
                        <div>
                            <p className="text-sm text-[var(--surface-600)]">Unique Protocols</p>
                            <p className="text-2xl font-bold text-[var(--secondary)]">
                                {isLoading ? "—" : stats.protocols}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[var(--surface-100)] border-b border-[var(--surface-300)]">
                            <tr>
                                <th className="px-6 py-4 font-medium text-[var(--surface-600)]">Client</th>
                                <th className="px-6 py-4 font-medium text-[var(--surface-600)]">Internal Name</th>
                                <th className="px-6 py-4 font-medium text-[var(--surface-600)]">Protocols</th>
                                <th className="px-6 py-4 font-medium text-[var(--surface-600)]">Status</th>
                                <th className="px-6 py-4 font-medium text-[var(--surface-600)] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--surface-200)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--surface-500)]">
                                        <div className="flex flex-col items-center gap-3">
                                            <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
                                            <span>Loading clients...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--surface-500)]">
                                        No IDE clients found.
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-[var(--surface-100)]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {client.logo_url ? (
                                                    <img src={client.logo_url} alt={client.display_name} className="w-8 h-8 rounded-lg" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-200)] flex items-center justify-center text-[var(--surface-500)]">
                                                        <Terminal className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-[var(--surface-900)]">
                                                        {client.display_name}
                                                    </div>
                                                    <div className="text-xs text-[var(--surface-500)] truncate max-w-[250px]">
                                                        {client.description || "No description"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--surface-600)] font-mono text-xs">
                                            {client.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {client.default_protocols.map((p) => (
                                                    <span key={p} className="px-2 py-1 bg-[var(--surface-200)] text-[var(--surface-700)] rounded-md text-xs font-medium">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(client.id, client.is_active)}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                                                    client.is_active
                                                        ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20 hover:bg-[var(--success)]/20"
                                                        : "bg-[var(--surface-200)] text-[var(--surface-600)] border-[var(--surface-300)] hover:bg-[var(--surface-300)]"
                                                )}
                                            >
                                                {client.is_active ? "Active" : "Inactive"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {client.docs_url && (
                                                <a
                                                    href={client.docs_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center p-2 text-[var(--surface-500)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors mr-2"
                                                    title="View Documentation"
                                                >
                                                    <BookOpen className="w-4 h-4" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => deleteClient(client.id)}
                                                className="inline-flex items-center justify-center p-2 text-[var(--surface-500)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Client"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddIDEClientModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={() => fetchData(true)}
            />
        </div>
    );
}
