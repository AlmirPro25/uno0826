"use client";

import { Key } from "lucide-react";
import { AppHeader } from "@/components/dashboard/app-header";
import { APIKeyManager } from "@/components/apikeys/apikey-manager";

export default function APIKeysPage() {
    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
                    <Key className="w-8 h-8 text-emerald-500" />
                    API Keys
                </h1>
                <p className="text-slate-500 mt-1 font-medium">
                    Gerencie chaves de API para integração de apps externos com o kernel
                </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-300">
                    <strong>Dica:</strong> Use API keys para autenticar requisições de servidores externos. 
                    Cada key pode ter scopes específicos para limitar o acesso.
                </p>
            </div>

            <APIKeyManager />
        </div>
    );
}
