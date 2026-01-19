"use client";

import { useState, useEffect } from "react";
import { DollarSign, FileText, CheckCircle, XCircle, Clock, Plus, Send } from "lucide-react";
import { toast } from "sonner";

import { mcpService } from "@/lib/mcp";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Negotiation {
    id: string;
    user_id: string;
    status: "OPEN" | "WON" | "LOST" | "EXPIRED";
    context: string;
    created_at: string;
    proposals?: Proposal[];
}

interface Proposal {
    id: string;
    negotiation_id: string;
    product_tier: string;
    base_price: number;
    discount: number;
    final_price: number;
    currency: string;
    valid_until: string;
    accepted_at?: string;
}

export default function SalesPanel() {
    const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
    const [loading, setLoading] = useState(false);
    const [newNegUserId, setNewNegUserId] = useState("");
    const [newNegContext, setNewNegContext] = useState("demo");

    useEffect(() => {
        loadNegotiations();
    }, []);

    const loadNegotiations = async () => {
        setLoading(true);
        try {
            const result = await mcpService.dispatch({
                agent_id: "sales-ops-agent-001",
                command: "sales:list",
                params: {}
            });
            if (result.result) {
                setNegotiations(result.result as Negotiation[]);
            }
        } catch (error) {
            console.error("Failed to load negotiations:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartNegotiation = async () => {
        if (!newNegUserId.trim()) {
            toast.error("User ID is required");
            return;
        }

        try {
            const result = await mcpService.dispatch({
                agent_id: "sales-ops-agent-001",
                command: "sales:negotiation:start",
                params: { user_id: newNegUserId, context: newNegContext }
            });

            if (result.status === "SUCCESS") {
                toast.success("Negotiation started!");
                setNewNegUserId("");
                loadNegotiations();
            } else {
                toast.error("Failed to start negotiation");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed");
        }
    };

    const handleCreateProposal = async (negotiationId: string, tier: string) => {
        try {
            const result = await mcpService.dispatch({
                agent_id: "sales-ops-agent-001",
                command: "sales:proposal:create",
                params: { negotiation_id: negotiationId, product_tier: tier }
            });

            if (result.status === "SUCCESS") {
                toast.success("Proposal created!");
                loadNegotiations();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed");
        }
    };

    const handleAcceptProposal = async (proposalId: string) => {
        try {
            const result = await mcpService.dispatch({
                agent_id: "sales-ops-agent-001",
                command: "sales:proposal:accept",
                params: { proposal_id: proposalId }
            });

            if (result.status === "SUCCESS") {
                toast.success("Proposal accepted! Billing triggered.");
                loadNegotiations();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "border-blue-500 text-blue-400";
            case "WON": return "border-green-500 text-green-400";
            case "LOST": return "border-red-500 text-red-400";
            case "EXPIRED": return "border-gray-500 text-gray-400";
            default: return "border-gray-500 text-gray-400";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "OPEN": return <Clock className="h-3 w-3" />;
            case "WON": return <CheckCircle className="h-3 w-3" />;
            case "LOST": return <XCircle className="h-3 w-3" />;
            default: return <Clock className="h-3 w-3" />;
        }
    };

    const formatPrice = (cents: number, currency: string) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency || 'BRL'
        }).format(cents / 100);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-green-400" /> Sales Pipeline
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadNegotiations}
                    className="text-xs border-green-700 text-green-400 hover:bg-green-900/20"
                >
                    Refresh
                </Button>
            </div>

            {/* Quick Start Negotiation */}
            <Card className="bg-black/50 border-green-900/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-300 flex items-center">
                        <Plus className="mr-2 h-4 w-4" /> Start Negotiation
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder="User UUID"
                            value={newNegUserId}
                            onChange={(e) => setNewNegUserId(e.target.value)}
                            className="bg-gray-950 border-green-900 text-green-300 text-xs"
                        />
                        <select
                            value={newNegContext}
                            onChange={(e) => setNewNegContext(e.target.value)}
                            className="bg-gray-950 border border-green-900 text-green-300 text-xs rounded px-2"
                        >
                            <option value="demo">Demo</option>
                            <option value="upgrade">Upgrade</option>
                            <option value="retention">Retention</option>
                        </select>
                        <Button
                            size="sm"
                            onClick={handleStartNegotiation}
                            className="bg-green-700 hover:bg-green-600 text-black text-xs"
                        >
                            Start
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Negotiations List */}
            {loading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : negotiations.length === 0 ? (
                <div className="text-center text-gray-600 py-8">No negotiations yet. Start one above!</div>
            ) : (
                <div className="space-y-3">
                    {negotiations.map((neg) => (
                        <Card key={neg.id} className="bg-black/50 border-green-900/30">
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={`${getStatusColor(neg.status)} flex items-center gap-1 text-[10px]`}>
                                                {getStatusIcon(neg.status)} {neg.status}
                                            </Badge>
                                            <span className="text-[10px] text-gray-500">{neg.context}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">{neg.id.slice(0, 8)}...</p>
                                    </div>
                                    {neg.status === "OPEN" && (
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCreateProposal(neg.id, "basic")}
                                                className="text-[10px] h-6 px-2 border-blue-800 text-blue-400"
                                            >
                                                Basic
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCreateProposal(neg.id, "pro")}
                                                className="text-[10px] h-6 px-2 border-purple-800 text-purple-400"
                                            >
                                                Pro
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCreateProposal(neg.id, "enterprise")}
                                                className="text-[10px] h-6 px-2 border-yellow-800 text-yellow-400"
                                            >
                                                Enterprise
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Proposals */}
                                {neg.proposals && neg.proposals.length > 0 && (
                                    <div className="border-t border-green-900/30 pt-2 mt-2 space-y-2">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Proposals</p>
                                        {neg.proposals.map((prop) => (
                                            <div key={prop.id} className="flex items-center justify-between bg-gray-950/50 p-2 rounded text-xs">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-3 w-3 text-gray-500" />
                                                    <span className="text-purple-400 font-medium">{prop.product_tier}</span>
                                                    <span className="text-green-400 font-bold">{formatPrice(prop.final_price, prop.currency)}</span>
                                                    {prop.discount > 0 && (
                                                        <span className="text-orange-400 text-[10px]">-{prop.discount}%</span>
                                                    )}
                                                </div>
                                                {prop.accepted_at ? (
                                                    <Badge className="bg-green-900/50 text-green-400 text-[10px]">
                                                        <CheckCircle className="h-2 w-2 mr-1" /> Accepted
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleAcceptProposal(prop.id)}
                                                        className="bg-green-700 hover:bg-green-600 text-black text-[10px] h-5 px-2"
                                                    >
                                                        <Send className="h-2 w-2 mr-1" /> Accept
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
