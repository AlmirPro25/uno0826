import { api } from "./api";

// ========================================
// MCP TYPES
// ========================================

export interface MCPCommand {
    agent_id: string;
    command: string;
    params: Record<string, any>;
    id?: string; // Optional, auto-generated if missing
}

export interface MCPResult {
    trace_id: string;
    status: "SUCCESS" | "FAILURE" | "VIOLATION";
    result?: any;
    error?: string;
    execution_time_ms: number;
    timestamp: string;
}

export interface MCPAgent {
    id: string;
    name: string;
    capabilities: string[];
    is_autonomous: boolean;
    status: "active" | "busy" | "offline";
    last_heartbeat: string;
}

export interface KernelEvent {
    id: string;
    trace_id: string;
    agent_id: string;
    event_type: "INTENT" | "SUCCESS" | "FAILURE" | "VIOLATION";
    payload: any;
    timestamp: string;
}

// ========================================
// MCP CLIENT SERVICE
// ========================================

export const mcpService = {
    // Dispatch a command to an agent
    dispatch: async (cmd: MCPCommand): Promise<MCPResult> => {
        const response = await api.post<MCPResult>("/mcp/dispatch", cmd);
        return response.data;
    },

    // List all registered agents
    listAgents: async (): Promise<MCPAgent[]> => {
        const response = await api.get<{ agents: MCPAgent[] }>("/mcp/agents");
        return response.data.agents;
    },

    // Get audit trail (all events)
    getAuditEvents: async (limit: number = 50): Promise<KernelEvent[]> => {
        const response = await api.get<{ events: KernelEvent[] }>(`/mcp/audit/events?limit=${limit}`);
        return response.data.events;
    },

    // Get full trace for a specific operation
    getTrace: async (traceId: string): Promise<KernelEvent[]> => {
        const response = await api.get<{ events: KernelEvent[] }>(`/mcp/audit/trace/${traceId}`);
        return response.data.events;
    },

    // Check system health
    health: async (): Promise<any> => {
        const response = await api.get("/mcp/health");
        return response.data;
    },

    // Get WebSocket URL for real-time audit stream
    getAuditWebSocketUrl: (): string => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
        // Convert http(s) to ws(s)
        const wsUrl = baseUrl.replace(/^http/, "ws");
        return `${wsUrl}/mcp/ws/audit`;
    }
};

// ========================================
// WEBSOCKET HOOK HELPER
// ========================================

export function connectAuditWebSocket(
    onMessage: (event: KernelEvent) => void,
    onError?: (error: Event) => void,
    onOpen?: () => void,
    onClose?: () => void
): WebSocket | null {
    try {
        const ws = new WebSocket(mcpService.getAuditWebSocketUrl());

        ws.onopen = () => {
            console.log("[MCP WS] Connected to Audit Stream");
            onOpen?.();
        };

        ws.onmessage = (msg) => {
            try {
                const event: KernelEvent = JSON.parse(msg.data);
                onMessage(event);
            } catch (e) {
                console.error("[MCP WS] Parse error:", e);
            }
        };

        ws.onerror = (err) => {
            console.error("[MCP WS] Error:", err);
            onError?.(err);
        };

        ws.onclose = () => {
            console.log("[MCP WS] Disconnected");
            onClose?.();
        };

        return ws;
    } catch (e) {
        console.error("[MCP WS] Failed to connect:", e);
        return null;
    }
}
