"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Lock, Bell, Moon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function SettingsPage() {
    const { user } = useAuth();

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account preferences and security.</p>
            </div>

            <div className="grid gap-6">

                {/* Profile Section */}
                <div className="glass-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" /> Profile
                    </h3>
                    <div className="grid gap-4 max-w-md">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input defaultValue={user?.name || "Anonymous User"} />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <Input defaultValue={user?.email} disabled className="bg-muted" />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button>Save Changes</Button>
                    </div>
                </div>

                {/* Security Section */}
                <div className="glass-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5" /> Security
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div>
                                <div className="font-medium">Two-Factor Authentication</div>
                                <div className="text-sm text-muted-foreground">Add an extra layer of security to your account.</div>
                            </div>
                            <Button variant="outline">Enable</Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                            <div>
                                <div className="font-medium">Password</div>
                                <div className="text-sm text-muted-foreground">Last changed 3 months ago.</div>
                            </div>
                            <Button variant="outline">Update Password</Button>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="glass-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5" /> Notifications
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                            <span className="text-sm">Email me about billing alerts</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <span className="text-sm">Email me about system downtime</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
