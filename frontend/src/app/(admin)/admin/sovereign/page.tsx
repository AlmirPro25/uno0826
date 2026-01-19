"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
    Activity,
    Terminal,
    Shield,
    Cpu,
    Zap,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Wifi,
    WifiOff
} from "lucide-react";
import { toast } from "sonner";

import { mcpService, MCPAgent, KernelEvent, connectAuditWebSocket } from "@/lib/mcp";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-state";
import SalesPanel from "./SalesPanel";
import DefconPanel from "./DefconPanel";
import MetricsPanel from "./MetricsPanel";

export default function SovereignConsolePage() {
    const [agents, setAgents] = useState<MCPAgent[]>([]);
    const [logs, setLogs] = useState<KernelEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<any>(null);
    const [commandInput, setCommandInput] = useState("");
    const [executing, setExecuting] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);

    // Initial load + WebSocket connection
    useEffect(() => {
        loadData();

        // Connect to WebSocket for real-time audit stream
        wsRef.current = connectAuditWebSocket(
            (event) => {
                // Add new event to the TOP of the list
                setLogs(prev => [event, ...prev].slice(0, 100)); // Keep max 100
            },
            () => setWsConnected(false),
            () => setWsConnected(true),
            () => setWsConnected(false)
        );

        return () => {
            wsRef.current?.close();
        };
    }, []);

    const loadData = async () => {
        try {
            const [agentsData, healthData, logsData] = await Promise.all([
                mcpService.listAgents(),
                mcpService.health(),
                mcpService.getAuditEvents(50)
            ]);
            setAgents(agentsData);
            setStatus(healthData);
            setLogs(logsData);
        } catch (error) {
            console.error(error);
            toast.error("Failed to connect to Kernel. Backend might be down.");
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!commandInput.trim()) return;

        setExecuting(true);
        try {
            // Parse simplistic command: "agent:action {json}"
            // For now, accept: "agent_id command {json_params}"
            // Ex: "identity command name" -> naive parsing
            // Better: "agent_id:command" and assume empty params or try to parse remaining string

            // Let's implement a simple parser for the "Terminal" feel
            // Format: agent_id command_name params_json
            // Example: identity-ops-agent-001 identity:user:list {"limit": 5}

            const firstSpace = commandInput.indexOf(" ");
            const secondSpace = commandInput.indexOf(" ", firstSpace + 1);

            if (firstSpace === -1 || secondSpace === -1) {
                // Fallback: try to send echo
                if (commandInput.startsWith("echo")) {
                    await mcpService.dispatch({
                        agent_id: "echo-agent-001",
                        command: "echo:message",
                        params: { message: commandInput.substring(5) }
                    });
                    toast.success("Echo sent");
                } else {
                    toast.error("Invalid format. Use: agent_id command {json}");
                }
                setExecuting(false);
                return;
            }

            const agentId = commandInput.substring(0, firstSpace);
            const commandName = commandInput.substring(firstSpace + 1, secondSpace);
            const paramsStr = commandInput.substring(secondSpace + 1);

            let params = {};
            try {
                params = JSON.parse(paramsStr);
            } catch (e) {
                toast.error("Invalid JSON params");
                setExecuting(false);
                return;
            }

            await mcpService.dispatch({
                agent_id: agentId,
                command: commandName,
                params: params
            });

            toast.success("Command dispatched to Kernel");
            setCommandInput("");
            // WebSocket will handle real-time updates

        } catch (error: any) {
            toast.error(error.response?.data?.error || "Dispatch failed");
        } finally {
            setExecuting(false);
        }
    };

    if (loading) return <LoadingOverlay message="Connecting to Watcher Kernel..." />;

    return (
        <div className="min-h-screen bg-black/95 text-green-500 font-mono p-6 space-y-6">
            {/* HEADS UP DISPLAY */}
            <header className="flex items-center justify-between border-b border-green-900/50 pb-4">
                <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-green-400 animate-pulse" />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tighter text-white">WATCHER KERNEL</h1>
                        <p className="text-xs text-green-600">Sovereign Agent Orchestration System v2.0</p>
                    </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" />
                        <span>UPTIME: {status?.uptime || "0s"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Cpu className="h-4 w-4" />
                        <span>AGENTS: {agents.length || 0}</span>
                    </div>
                    <Badge variant="outline" className="border-green-600 text-green-400">
                        ONLINE
                    </Badge>
                    {wsConnected ? (
                        <Badge variant="outline" className="border-cyan-500 text-cyan-400 flex items-center gap-1">
                            <Wifi className="h-3 w-3" /> LIVE
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="border-orange-500 text-orange-400 flex items-center gap-1">
                            <WifiOff className="h-3 w-3" /> POLLING
                        </Badge>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: AGENT MATRIX */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white flex items-center">
                        <Cpu className="mr-2 h-4 w-4" /> Active Agents
                    </h2>
                    <div className="grid gap-3">
                        {agents.map((agent) => (
                            <Card key={agent.id} className="bg-black/50 border-green-900/30 hover:border-green-500/50 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-sm font-bold text-green-300">
                                            {agent.name}
                                        </CardTitle>
                                        <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                            {agent.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono">{agent.id}</p>
                                </CardHeader>
                                <CardContent className="text-xs space-y-2">
                                    <div className="flex flex-wrap gap-1">
                                        {agent.capabilities.slice(0, 3).map(cap => (
                                            <span key={cap} className="px-1.5 py-0.5 bg-green-900/20 text-green-600 rounded">
                                                {cap}
                                            </span>
                                        ))}
                                        {agent.capabilities.length > 3 && (
                                            <span className="px-1.5 py-0.5 text-green-800">+{agent.capabilities.length - 3} more</span>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-green-900/30 flex justify-between items-center text-[10px] text-gray-500">
                                        <span>Heartbeat: {new Date(agent.last_heartbeat).toLocaleTimeString()}</span>
                                        {agent.is_autonomous && <Zap className="h-3 w-3 text-yellow-500" />}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* SALES PIPELINE */}
                    <div className="mt-6 border-t border-green-900/30 pt-4">
                        <SalesPanel />
                    </div>

                    {/* DEFCON GOVERNANCE */}
                    <div className="mt-6 border-t border-green-900/30 pt-4">
                        <DefconPanel />
                    </div>
                </div>

                {/* MIDDLE/RIGHT COLUMN: TERMINAL & LOGS */}
                <div className="lg:col-span-2 space-y-4 flex flex-col h-[calc(100vh-140px)]">

                    {/* LIVE METRICS */}
                    <div>
                        <MetricsPanel />
                    </div>

                    {/* TERMINAL INPUT */}
                    <div className="bg-black border border-green-800 rounded-lg p-4 shadow-lg shadow-green-900/10">
                        <h2 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                            <Terminal className="mr-2 h-4 w-4" /> Quick Command Dispatch
                        </h2>
                        <form onSubmit={handleExecute} className="flex gap-2">
                            <Input
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                placeholder="agent_id command {params}"
                                className="bg-gray-950 border-green-900 text-green-300 font-mono text-sm"
                            />
                            <Button type="submit" disabled={executing} className="bg-green-700 hover:bg-green-600 text-black font-bold">
                                {executing ? "..." : "EXEC"}
                            </Button>
                        </form>
                        <div className="mt-2 text-[10px] text-gray-600 space-y-0.5">
                            <div>Ex: identity-ops-agent-001 identity:user:list {"{"}"limit":5{"}"}</div>
                            <div>Ex: sales-ops-agent-001 sales:negotiation:start {"{"}"user_id":"UUID","context":"demo"{"}"}</div>
                            <div>Ex: sales-ops-agent-001 sales:proposal:create {"{"}"negotiation_id":"UUID","product_tier":"pro"{"}"}</div>
                            <div>Ex: policy-ops-agent-001 policy:killswitch:activate {"{"}"reason":"test"{"}"}</div>
                            <div>Ex: agent:memory:ops memory:conflict:list {"{"}"domain": "billing"{"}"}</div>
                            <div>Ex: procurement-ops-agent-001 procurement:sourcing:search {"{"}"query":"server","targets":["https://store.com"]{"}"}</div>
                        </div>
                    </div>

                    {/* AUDIT LOG STREAM */}
                    <div className="flex-1 bg-gray-950/50 border border-green-900/30 rounded-lg overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-green-900/30 bg-black/40 flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-green-400 flex items-center">
                                <Activity className="mr-2 h-4 w-4" /> Kernel Audit Stream
                            </h2>
                            <span className="text-xs text-gray-500 animate-pulse">● Live</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-black">
                            {logs.length === 0 && (
                                <div className="text-center text-gray-600 py-10">No events recorded yet.</div>
                            )}
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 text-xs p-2 hover:bg-white/5 rounded transition-colors group">
                                    <div className="mt-0.5">
                                        {log.event_type === 'SUCCESS' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                                        {log.event_type === 'FAILURE' && <XCircle className="h-3 w-3 text-red-500" />}
                                        {log.event_type === 'INTENT' && <Clock className="h-3 w-3 text-blue-500" />}
                                        {log.event_type === 'VIOLATION' && <AlertCircle className="h-3 w-3 text-orange-500" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${log.event_type === 'SUCCESS' ? 'text-green-400' :
                                                log.event_type === 'FAILURE' ? 'text-red-400' :
                                                    log.event_type === 'VIOLATION' ? 'text-orange-400' : 'text-blue-400'
                                                }`}>
                                                {log.event_type}
                                            </span>
                                            <span className="text-gray-500">|</span>
                                            <span className="text-green-200">{log.agent_id}</span>
                                            <span className="text-gray-600 ml-auto">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-gray-400 break-all">
                                            Using {JSON.stringify(log.payload).substring(0, 100)}...
                                        </div>
                                        <div className="text-[10px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Trace: {log.trace_id}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
