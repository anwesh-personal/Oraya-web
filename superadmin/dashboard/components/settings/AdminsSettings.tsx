"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Shield, User, Mail, Calendar } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface Admin {
    id: string;
    email: string;
    name: string;
    role: "super_admin" | "admin" | "moderator";
    createdAt: string;
    lastLogin: string | null;
}

// Initial admin including your credentials
const initialAdmins: Admin[] = [
    {
        id: "1",
        email: "anweshrath@gmail.com",
        name: "Anwesh Rath",
        role: "super_admin",
        createdAt: "2026-02-10T02:26:00Z",
        lastLogin: "2026-02-10T02:26:00Z",
    },
];

export function AdminsSettings() {
    const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        email: "",
        name: "",
        role: "admin" as Admin["role"],
        password: "",
    });

    const handleAddAdmin = () => {
        if (!newAdmin.email || !newAdmin.name || !newAdmin.password) return;

        const admin: Admin = {
            id: Date.now().toString(),
            email: newAdmin.email,
            name: newAdmin.name,
            role: newAdmin.role,
            createdAt: new Date().toISOString(),
            lastLogin: null,
        };

        setAdmins([...admins, admin]);
        setNewAdmin({ email: "", name: "", role: "admin", password: "" });
        setShowAddForm(false);

        // TODO: API call to create admin in platform_admins table
        console.log("Creating admin:", { ...admin, password: newAdmin.password });
    };

    const handleDeleteAdmin = (id: string) => {
        if (admins.length === 1) {
            alert("Cannot delete the last admin");
            return;
        }
        setAdmins(admins.filter((a) => a.id !== id));
    };

    const getRoleBadge = (role: Admin["role"]) => {
        switch (role) {
            case "super_admin":
                return "bg-violet-500/20 text-violet-300 border-violet-500/30";
            case "admin":
                return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
            case "moderator":
                return "bg-gray-500/20 text-gray-300 border-gray-500/30";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white">Platform Admins</h3>
                    <p className="text-sm text-gray-400 mt-1">Manage who has access to the admin panel</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
                >
                    <Plus className="w-4 h-4" />
                    Add Admin
                </button>
            </div>

            {/* Add Admin Form */}
            {showAddForm && (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-4">Add New Admin</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                            <input
                                type="text"
                                value={newAdmin.name}
                                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                placeholder="Full name"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                            <input
                                type="email"
                                value={newAdmin.email}
                                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                placeholder="email@example.com"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                            <input
                                type="password"
                                value={newAdmin.password}
                                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                            <select
                                value={newAdmin.role}
                                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value as Admin["role"] })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            >
                                <option value="admin">Admin</option>
                                <option value="moderator">Moderator</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <button
                            onClick={handleAddAdmin}
                            className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-white font-medium hover:from-violet-500 hover:to-indigo-500 transition-all"
                        >
                            Create Admin
                        </button>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Admins Table */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Admin
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Last Login
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {admins.map((admin) => (
                            <tr key={admin.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{admin.name}</p>
                                            <p className="text-sm text-gray-400">{admin.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border capitalize",
                                        getRoleBadge(admin.role)
                                    )}>
                                        {admin.role.replace("_", " ")}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {formatDate(admin.createdAt)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {admin.lastLogin ? formatDate(admin.lastLogin) : "Never"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteAdmin(admin.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                                        disabled={admins.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
