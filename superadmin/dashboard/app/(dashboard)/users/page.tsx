import { createServiceRoleClient } from "@/lib/supabase/server";
import { UsersTable } from "@/components/users/UsersTable";
import { Plus, Download, Filter } from "lucide-react";

async function getUsers() {
    const supabase = createServiceRoleClient();

    const { data: licenses, error } = await supabase
        .from("user_licenses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error fetching users:", error);
        return [];
    }

    return licenses || [];
}

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Users & Licenses</h1>
                    <p className="text-surface-600 mt-1">
                        Manage user accounts, licenses, and subscriptions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-100 border border-surface-300 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-200 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-100 border border-surface-300 rounded-xl text-sm font-medium text-surface-700 hover:bg-surface-200 transition-colors">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl text-sm font-medium text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all">
                        <Plus className="w-4 h-4" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="card p-4">
                    <p className="text-sm text-surface-500">Total Users</p>
                    <p className="text-2xl font-bold text-surface-900 mt-1">1,247</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-surface-500">Active Licenses</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">983</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-surface-500">Trial Users</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">156</p>
                </div>
                <div className="card p-4">
                    <p className="text-sm text-surface-500">Churned (30d)</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">23</p>
                </div>
            </div>

            {/* Users Table */}
            <UsersTable users={users} />
        </div>
    );
}
