"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, CreditCard, HardDrive, Users, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        apps: 0,
        events: 0,
        storage: "0 GB"
    });

    // Real data fetching
    useEffect(() => {
        async function loadData() {
            if (!user?.id) return;

            try {
                // 1. Get Apps Count
                const appsRes = await api.get("/apps/mine?limit=1");

                // 2. Get Events Count (if available) - Fallback to mock if API fails or is empty
                let eventsCount = 0;
                try {
                    const eventsRes = await api.get(`/events/${user.id}?limit=1`);
                    // Assuming response is array or has total
                    eventsCount = eventsRes.data.length || 0; // Simple fallback
                } catch (e) {
                    console.log("Events API not ready yet for stats");
                }

                setStats({
                    apps: appsRes.data.total || 0,
                    events: eventsCount,
                    storage: "1.2 GB" // Mocked until storage service is ready
                });

            } catch (e) {
                console.error("Failed to load dashboard stats", e);
            }
        }
        loadData();
    }, [user]);

    const cards = [
        {
            title: "Total Events",
            value: stats.events.toLocaleString(),
            change: "+12.5%",
            trend: "up",
            icon: Activity,
            color: "text-blue-500",
        },
        {
            title: "Active Apps",
            value: stats.apps.toString(),
            change: "+0%",
            trend: "neutral",
            icon: HardDrive,
            color: "text-purple-500",
        },
        {
            title: "Storage Used",
            value: stats.storage,
            change: "+2.1%",
            trend: "up",
            icon: Users, // Using generically
            color: "text-green-500",
        },
        {
            title: "Current Bill",
            value: "$0.00",
            change: "Included",
            trend: "neutral",
            icon: CreditCard,
            color: "text-yellow-500",
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user?.name || "User"}. Here is your system overview.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button>
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Quick Action
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-6 rounded-xl border border-border bg-card/50 hover:bg-card/80 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </p>
                                <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
                            </div>
                            <div className={`p-3 rounded-full bg-background/50 ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs">
                            <span className={card.trend === "up" ? "text-green-500" : "text-muted-foreground"}>
                                {card.change}
                            </span>
                            <span className="text-muted-foreground ml-2">from last month</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-7">
                <div className="col-span-4 glass-card p-6 rounded-xl border border-border">
                    <h3 className="font-semibold mb-4">Recent Ingestion</h3>
                    <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg bg-muted/10">
                        <p className="text-muted-foreground text-sm">Real-time chart visualization would go here</p>
                    </div>
                </div>
                <div className="col-span-3 glass-card p-6 rounded-xl border border-border">
                    <h3 className="font-semibold mb-4">Live Events</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <div className="flex-1">
                                    <div className="text-sm font-medium">api.request.success</div>
                                    <div className="text-xs text-muted-foreground">2ms ago via api-gateway</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
