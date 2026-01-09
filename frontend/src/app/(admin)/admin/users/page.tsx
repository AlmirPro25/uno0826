"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Shield, User as UserIcon, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { User } from "@/types";

interface PaginatedUsers {
    data: User[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export default function AdminUsersPage() {
    const [term, setTerm] = useState("");
    const [data, setData] = useState<PaginatedUsers | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/users?page=1&limit=50&search=${term}`);
            setData(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [term]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">User Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage access and roles across the platform.</p>
                </div>
                <Button variant="outline" className="border-red-900/30 text-red-400 hover:bg-red-950/20 hover:text-red-300">
                    Export Audit Log
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                <Search className="w-4 h-4 text-zinc-500 ml-2" />
                <Input
                    className="bg-transparent border-none focus-visible:ring-0 text-zinc-300 placeholder:text-zinc-600"
                    placeholder="Search users..."
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-zinc-400 font-medium">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-zinc-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    Loading users...
                                </td>
                            </tr>
                        )}

                        {!loading && data?.data.map((user) => (
                            <motion.tr
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-white/5 transition-colors group"
                            >
                                <td className="px-6 py-4 font-medium text-zinc-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                                            {(user.name || user.email || "?")[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white">{user.name || "Unknown"}</div>
                                            <div className="text-xs text-zinc-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {user.role === "admin" || user.role === "super_admin" ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-950/30 text-red-500 border border-red-900/30">
                                            <Shield className="w-3 h-3" /> {user.role}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                                            <UserIcon className="w-3 h-3" /> User
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        // Use generic fallback as backend might return "active" or "suspended"
                                        user.status === 'active'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                        }`}>
                                        {user.status || "Unknown"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-zinc-400">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
