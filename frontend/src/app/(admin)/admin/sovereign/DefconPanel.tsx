"use client";

import { useState, useEffect } from "react";
import { Shield, ChevronUp, ChevronDown, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";

import { mcpService } from "@/lib/mcp";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DefconStatus {
    level: number;
    level_name: string;
    rate_limit: number;
    is_critical: boolean;
    history_count: number;
}

const DEFCON_COLORS: Record<number, string> = {
    5: "from-green-500 to-green-700",
    4: "from-blue-500 to-blue-700",
    3: "from-yellow-500 to-yellow-700",
    2: "from-orange-500 to-orange-700",
    1: "from-red-600 to-red-900",
};

const DEFCON_BORDERS: Record<number, string> = {
    5: "border-green-500",
    4: "border-blue-500",
    3: "border-yellow-500",
    2: "border-orange-500",
    1: "border-red-600",
};

const DEFCON_TEXT: Record<number, string> = {
    5: "text-green-400",
    4: "text-blue-400",
    3: "text-yellow-400",
    2: "text-orange-400",
    1: "text-red-400",
};

export default function DefconPanel() {
    const [status, setStatus] = useState<DefconStatus | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStatus();
        const interval = setInterval(loadStatus, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const loadStatus = async () => {
        try {
            const result = await mcpService.dispatch({
                agent_id: "policy-ops-agent-001",
                command: "policy:defcon:get",
                params: {}
            });
            if (result.result) {
                setStatus(result.result as DefconStatus);
            }
        } catch (error) {
            console.error("Failed to load DEFCON status:", error);
        }
    };

    const handleEscalate = async () => {
        setLoading(true);
        try {
            await mcpService.dispatch({
                agent_id: "policy-ops-agent-001",
                command: "policy:defcon:escalate",
                params: { reason: "Manual escalation from Console" }
            });
            toast.warning("DEFCON Escalated!");
            loadStatus();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to escalate");
        } finally {
            setLoading(false);
        }
    };

    const handleDeescalate = async () => {
        setLoading(true);
        try {
            const currentLevel = status?.level || 5;
            await mcpService.dispatch({
                agent_id: "policy-ops-agent-001",
                command: "policy:defcon:set",
                params: { level: Math.min(currentLevel + 1, 5), reason: "Manual de-escalation" }
            });
            toast.success("DEFCON De-escalated");
            loadStatus();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to de-escalate");
        } finally {
            setLoading(false);
        }
    };

    const handleKillSwitch = async () => {
        if (!confirm("⚠️ CONFIRMA ATIVAÇÃO DO KILL SWITCH?\n\nIsso congelará TODO o sistema.")) {
            return;
        }
        setLoading(true);
        try {
            await mcpService.dispatch({
                agent_id: "policy-ops-agent-001",
                command: "policy:killswitch:activate",
                params: { reason: "Manual activation from Console" }
            });
            toast.error("🚨 KILL SWITCH ACTIVATED - SYSTEM FROZEN");
            loadStatus();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResume = async () => {
        setLoading(true);
        try {
            await mcpService.dispatch({
                agent_id: "policy-ops-agent-001",
                command: "policy:killswitch:deactivate",
                params: {}
            });
            toast.success("✅ System Resumed - DEFCON Reset to 5");
            loadStatus();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to resume");
        } finally {
            setLoading(false);
        }
    };

    const level = status?.level || 5;
    const isCritical = level === 1;

    return (
        <Card className={`bg-black/50 ${DEFCON_BORDERS[level]} border-2 transition-all duration-500`}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className={`h-4 w-4 ${DEFCON_TEXT[level]}`} />
                        <span>DEFCON STATUS</span>
                    </div>
                    {isCritical && (
                        <Badge className="bg-red-600 text-white animate-pulse">
                            <AlertTriangle className="h-3 w-3 mr-1" /> FROZEN
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Level Indicator */}
                <div className="flex items-center justify-center">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${DEFCON_COLORS[level]} flex items-center justify-center shadow-lg ${isCritical ? 'animate-pulse' : ''}`}>
                        <span className="text-4xl font-bold text-white">{level}</span>
                    </div>
                </div>

                <div className="text-center">
                    <p className={`text-lg font-bold ${DEFCON_TEXT[level]}`}>
                        {status?.level_name || "LOADING"}
                    </p>
                    {status?.rate_limit ? (
                        <p className="text-xs text-gray-500">Rate Limit: {status.rate_limit} rps</p>
                    ) : (
                        <p className="text-xs text-gray-500">No Rate Limit</p>
                    )}
                </div>

                {/* Control Buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEscalate}
                        disabled={loading || level === 1}
                        className="border-orange-700 text-orange-400 hover:bg-orange-900/20 text-xs"
                    >
                        <ChevronUp className="h-3 w-3 mr-1" /> Escalate
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeescalate}
                        disabled={loading || level === 5}
                        className="border-green-700 text-green-400 hover:bg-green-900/20 text-xs"
                    >
                        <ChevronDown className="h-3 w-3 mr-1" /> De-escalate
                    </Button>
                </div>

                {/* Emergency Controls */}
                <div className="border-t border-gray-800 pt-3 space-y-2">
                    {isCritical ? (
                        <Button
                            size="sm"
                            onClick={handleResume}
                            disabled={loading}
                            className="w-full bg-green-700 hover:bg-green-600 text-black text-xs"
                        >
                            <CheckCircle className="h-3 w-3 mr-1" /> RESUME SYSTEM
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleKillSwitch}
                            disabled={loading}
                            className="w-full text-xs"
                        >
                            <Zap className="h-3 w-3 mr-1" /> KILL SWITCH
                        </Button>
                    )}
                </div>

                {/* Info Footer */}
                <div className="text-[10px] text-gray-600 text-center">
                    {status?.history_count || 0} level changes recorded
                </div>
            </CardContent>
        </Card>
    );
}
