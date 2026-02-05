"use client";

import { useEffect, useState } from "react";
import { useGhostStore } from "@/stores/useGhostStore";
import { useAuthStore } from "@/stores/useAuthStore"; // NEW: Auth store
import { useSocket } from "@/hooks/useSocket"; // NEW: Socket hook
import { ContactList } from "@/components/layout/ContactList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { GhostControls } from "@/components/controls/GhostControls";
import { Terminal, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QrTimer } from "@/components/auth/QrTimer";

export default function Dashboard() {
    const {
        qrCode,
        isConnected
    } = useGhostStore();

    const { isAuthenticated, checkAuth, logout } = useAuthStore();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    // Initialize socket (client-only)
    useSocket();

    useEffect(() => {
        setIsMounted(true);
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (isMounted && !isAuthenticated && localStorage.getItem('ghost-token') === null) {
            router.push('/login');
        }
    }, [isAuthenticated, router, isMounted]);

    // ABSOLUTE HYDRATION GUARD: Server and Client first-pass render identical null.
    if (!isMounted) {
        return null;
    }

    // Now safely on the client
    const hasToken = localStorage.getItem('ghost-token') !== null;

    if (!isAuthenticated && hasToken) {
        return (
            <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
                <div className="font-mono text-gray-500 text-sm animate-pulse">
                    AUTHENTICATING...
                </div>
            </div>
        );
    }

    if (!isAuthenticated && !hasToken) {
        return null; // Will be redirected by useEffect
    }

    if (qrCode) {
        return (
            <div className="h-screen w-screen bg-black flex flex-col items-center justify-center space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-mono font-bold tracking-widest text-emerald-500">GHOST PROTOCOL</h1>
                    <p className="text-muted-foreground font-mono text-sm">SECURE LINK REQUIRED</p>
                </div>
                {/* QR Code Container */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative p-4 bg-white rounded-lg border border-gray-200">
                        {/* It's okay to render directly from base64 for QR codes. */}
                        <img src={qrCode} alt="Scan QR" className="w-64 h-64 mix-blend-multiply" />

                        {/* Scanning Line Animation */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent h-[10%] w-full animate-scan pointer-events-none" />
                    </div>
                </div>

                <div className="font-mono text-center space-y-2">
                    <p className="text-xs text-muted-foreground/70">
                        OPEN WHATSAPP &gt; LINKED DEVICES &gt; LINK A DEVICE
                    </p>
                    <QrTimer key={qrCode} />
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-background flex flex-col overflow-hidden">
            {/* Top Status Bar */}
            <header className="h-10 bg-black border-b border-border flex items-center px-4 justify-between select-none">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span className="font-mono text-xs font-bold tracking-wider text-emerald-500">
                        GHOST PROTOCOL <span className="text-muted-foreground">v1.0.0</span>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-destructive'}`} />
                        <span className="font-mono text-[10px] text-muted-foreground">
                            {isConnected ? 'SYSTEM_ONLINE' : 'DISCONNECTED'}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout} className="h-6 px-2 text-xs text-red-400 hover:bg-red-900/20 hover:text-red-300">
                        <LogOut className="w-3 h-3 mr-1" /> LOGOUT
                    </Button>
                </div>
            </header>

            {/* Main Work Area */}
            <div className="flex-1 flex overflow-hidden">
                <ContactList />
                <ChatWindow />
                <GhostControls />
            </div>
        </div>
    );
}
