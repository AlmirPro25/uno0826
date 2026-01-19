"use client";

import { useState, useEffect } from "react";
import { Activity, Zap, AlertCircle, Clock, BarChart3 } from "lucide-react";

import { mcpService } from "@/lib/mcp";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface WarObsMetrics {
    rate: number;      // requests per second
    errors: number;    // error rate (0-1)
    duration: number;  // average latency in ms
    pressure: {
        level: string; // normal, elevated, high, critical
        score: number; // 0-100
    };
    active_defenses: string[];
}

const PRESSURE_COLORS: Record<string, string> = {
    normal: "text-green-400 border-green-500",
    elevated: "text-yellow-400 border-yellow-500",
    high: "text-orange-400 border-orange-500",
    critical: "text-red-400 border-red-500",
};

export default function MetricsPanel() {
    const [metrics, setMetrics] = useState<WarObsMetrics | null>(null);

    useEffect(() => {
        loadMetrics();
        const interval = setInterval(loadMetrics, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    const loadMetrics = async () => {
        try {
            const health = await mcpService.health();
            // Assuming the health endpoint returns warobs data structure
            // If not, we might need to adjust the backend response or use a specific metrics endpoint.
            // For now, let's assume 'warobs' key exists in health response.
            if (health.warobs) {
                setMetrics(health.warobs);
            }
        } catch (error) {
            console.error("Failed to load metrics:", error);
        }
    };

    if (!metrics) {
        return (
            <Card className="bg-black/30 border-gray-800">
                <CardContent className="p-4 text-center text-xs text-gray-500 animate-pulse">
                    Connecting to WarOps Telemetry...
                </CardContent>
            </Card>
        );
    }

    const pressureClass = PRESSURE_COLORS[metrics.pressure.level] || PRESSURE_COLORS.normal;

    return (
        <Card className="bg-black/50 border-gray-800">
            <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-xs text-gray-400 font-mono hidden md:flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" /> LIVE TELEMETRY
                    </div>
                    <div className={`px-2 py-0.5 border rounded text-[10px] uppercase font-bold ${pressureClass}`}>
                        PRESSURE: {metrics.pressure.level}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                    {/* RATE */}
                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800 text-center">
                        <div className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                            <Zap className="h-3 w-3" /> RATE
                        </div>
                        <div className="text-lg font-bold text-white">{metrics.rate.toFixed(1)}</div>
                        <div className="text-[9px] text-gray-600">req/s</div>
                    </div>

                    {/* ERRORS */}
                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800 text-center">
                        <div className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                            <AlertCircle className="h-3 w-3" /> ERR
                        </div>
                        <div className={`text-lg font-bold ${metrics.errors > 0 ? "text-red-400" : "text-white"}`}>
                            {(metrics.errors * 100).toFixed(2)}%
                        </div>
                        <div className="text-[9px] text-gray-600">error rate</div>
                    </div>

                    {/* DURATION */}
                    <div className="bg-gray-950/50 p-2 rounded border border-gray-800 text-center">
                        <div className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" /> LATENCY
                        </div>
                        <div className={`text-lg font-bold ${metrics.duration > 500 ? "text-yellow-400" : "text-white"}`}>
                            {metrics.duration.toFixed(0)}
                        </div>
                        <div className="text-[9px] text-gray-600">ms avg</div>
                    </div>
                </div>

                {/* VISUALIZER (Fake waveform for now, real later) */}
                <div className="h-8 flex items-end gap-0.5 opacity-50">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-green-500/50 rounded-t"
                            style={{
                                height: `${Math.max(10, Math.random() * 100)}%`,
                                opacity: 1 - (i * 0.02)
                            }}
                        />
                    ))}
                </div>

                {metrics.active_defenses.length > 0 && (
                    <div className="text-[10px] text-red-400 border border-red-900/50 bg-red-950/20 p-2 rounded">
                        <span className="font-bold">ACTIVE DEFENSES:</span> {metrics.active_defenses.join(", ")}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
