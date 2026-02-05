'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Activity, Target, Brain, Zap, BarChart3,
    Image, Settings, ChevronLeft, Users, MessageSquare, Server, Crown, Loader2
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { RiskAlertPanel } from '@/components/RiskAlertPanel';

export default function CommandCenterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    const navItems = [
        { href: '/command-center/sovereign-chat', label: 'Sovereign Chat', icon: Crown, highlight: true },
        { href: '/command-center', label: 'Overview', icon: Activity },
        { href: '/command-center/chat', label: 'Chat', icon: MessageSquare },
        { href: '/command-center/operations', label: 'Operations', icon: Target },
        { href: '/command-center/cognitive', label: 'Cognitive', icon: Brain },
        { href: '/command-center/leads', label: 'Leads', icon: Users },
        { href: '/command-center/campaigns', label: 'Campaigns', icon: Zap },
        { href: '/command-center/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/command-center/media', label: 'Media', icon: Image },
        { href: '/command-center/advanced', label: 'Advanced', icon: Zap },
    ];

    // Prevent hydration mismatch by rendering a consistent loading state on server
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    <p className="text-gray-400">Loading Command Center...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-black/60 backdrop-blur-xl border-r border-purple-500/20 z-40">
                {/* Logo */}
                <div className="p-6 border-b border-purple-500/20">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="text-4xl">👻</div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                GHOST PROTOCOL
                            </h1>
                            <p className="text-purple-300/50 text-xs">Command Center v5.0</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/command-center' && pathname.startsWith(item.href));
                        const isHighlight = 'highlight' in item && item.highlight;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isHighlight
                                    ? isActive
                                        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                                        : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-400/80 border border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-lg hover:shadow-yellow-500/10'
                                    : isActive
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isHighlight ? 'text-yellow-400' : isActive ? 'text-purple-400' : ''}`} />
                                <span className={isHighlight ? 'font-medium' : ''}>{item.label}</span>
                                {isHighlight && (
                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 uppercase tracking-wider">
                                        AI
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Divider */}
                <div className="mx-4 my-4 border-t border-gray-700/50" />

                {/* Secondary Nav */}
                <nav className="p-4 space-y-2">
                    <Link
                        href="/command-center/status"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/command-center/status'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Server className="w-5 h-5" />
                        System Status
                    </Link>
                    <Link
                        href="/command-center/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/command-center/settings'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Link>
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-purple-500/20">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back to Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 flex flex-col min-h-screen">
                {/* Global Header */}
                <header className="h-16 border-b border-gray-700/50 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <h1 className="text-white font-medium capitalize">
                            {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Overview'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            GP
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-8">
                    {children}
                </div>

                {/* Real-time floating alerts */}
                <RiskAlertPanel />
            </main>
        </div>
    );
}
