"use client";

import { Shield, Key, Users, Lock } from "lucide-react";

export default function IdentityConceptPage() {
    return (
        <div className="space-y-12 max-w-4xl">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm tracking-widest uppercase">
                    <Shield className="w-4 h-4" />
                    Conceitos
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                    Identidade <span className="text-amber-500">Soberana</span>
                </h1>
                <p className="text-lg text-slate-400">
                    No PROST-QS, identidade não é apenas autenticação. 
                    É a base de toda governança e auditoria do sistema.
                </p>
            </div>

            {/* Core Concept */}
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Princípio Central</h2>
                <p className="text-slate-400 mb-4">
                    <strong className="text-white">Uma conta global, vínculos locais por app.</strong>
                </p>
                <p className="text-slate-500 text-sm">
                    Usuários têm uma identidade única no kernel, mas podem ter perfis e permissões 
                    diferentes em cada aplicação vinculada.
                </p>
            </div>

            {/* Identity Layers */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Camadas de Identidade</h2>
                <div className="grid gap-4">
                    {[
                        { icon: Users, title: "Global Identity", desc: "Conta única no kernel com email verificado", color: "indigo" },
                        { icon: Key, title: "App Binding", desc: "Vínculo específico entre usuário e aplicação", color: "emerald" },
                        { icon: Lock, title: "Credentials", desc: "App Key + Secret para autenticação de apps", color: "amber" },
                    ].map((item) => (
                        <div key={item.title} className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-xl">
                            <div className={`p-3 rounded-xl bg-${item.color}-500/20`}>
                                <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">{item.title}</h3>
                                <p className="text-sm text-slate-500">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Auth Flow */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Fluxo de Autenticação</h2>
                <div className="space-y-3">
                    {[
                        "Usuário faz login no kernel (email + senha)",
                        "Kernel retorna JWT com claims globais",
                        "App solicita vínculo com o usuário",
                        "Kernel adiciona claims específicos do app",
                        "Usuário acessa recursos do app com permissões locais"
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                {i + 1}
                            </div>
                            <span className="text-slate-400">{step}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* App Credentials */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Credenciais de Aplicação</h2>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm">App Key</span>
                            <code className="text-emerald-400 font-mono text-sm">pk_live_xxxxxxxxxxxxx</code>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm">App Secret</span>
                            <code className="text-rose-400 font-mono text-sm">sk_live_xxxxxxxxxxxxx</code>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-slate-500">
                    <strong className="text-amber-400">⚠️ Importante:</strong> O App Secret nunca deve ser exposto no frontend. 
                    Use apenas no backend da sua aplicação.
                </p>
            </div>

            {/* Code Example */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Exemplo de Integração</h2>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-sm">
                    <pre className="text-slate-300">{`// Backend: Autenticar com credenciais
const prostqs = new ProstQS({
  appKey: process.env.PROSTQS_APP_KEY,
  appSecret: process.env.PROSTQS_APP_SECRET
});

// Verificar token do usuário
const user = await prostqs.identity.verify(token);

// Vincular usuário ao app
await prostqs.identity.linkApp(user.id, {
  role: "member",
  metadata: { department: "sales" }
});`}</pre>
                </div>
            </div>
        </div>
    );
}
