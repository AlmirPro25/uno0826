"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[60vh] flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="w-20 h-20 rounded-2xl bg-rose-500/20 flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10 text-rose-400" />
                        </div>
                        
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                                Algo deu errado
                            </h2>
                            <p className="text-slate-400 text-sm">
                                Ocorreu um erro inesperado. Tente recarregar a página.
                            </p>
                        </div>

                        {this.state.error && (
                            <details className="text-left">
                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                                    Detalhes técnicos
                                </summary>
                                <pre className="mt-2 p-3 rounded-lg bg-black/30 text-xs font-mono text-rose-400 overflow-auto max-h-32">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Recarregar
                            </Button>
                            <Link href="/dashboard">
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-xl border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest text-xs w-full"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
