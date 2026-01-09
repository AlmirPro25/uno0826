"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Lock, Globe, Activity, ChevronRight, CheckCircle2, Cpu, Box, Fingerprint, Database, ZapOff, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Governança Soberana",
    description: "Valide cada evento antes que ele toque sua lógica. O UNO atua como um firewall inteligente para o seu business core.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10"
  },
  {
    icon: Zap,
    title: "Kernel Econômico",
    description: "Monetize qualquer ação. Orquestração nativa de Stripe e Mercado Pago com ledger imutável e auditoria absoluta.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    icon: Fingerprint,
    title: "Identidade Federada",
    description: "User, App e Agent são cidadãos de primeira classe. Autenticação soberana sem depender de silos de terceiros.",
    color: "text-blue-400",
    bg: "bg-blue-500/10"
  },
  {
    icon: Activity,
    title: "Observabilidade Total",
    description: "Dashboard cognitivo com telemetria em tempo real de cada decisão tomada pelo kernel e fluxo financeiro.",
    color: "text-amber-400",
    bg: "bg-amber-500/10"
  },
  {
    icon: Cpu,
    title: "Orquestração de Agentes",
    description: "Governe agentes de IA com guardrails humanos. O agente propõe, o kernel valida e você mantém a soberania.",
    color: "text-rose-400",
    bg: "bg-rose-500/10"
  },
  {
    icon: Database,
    title: "Financial Pipeline",
    description: "Pipeline de webhooks resiliente com retentativas inteligentes e reconciliação automática de pagamentos.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10"
  },
];

const giants = ["Google", "Stripe", "Mercado Pago", "GitHub", "AWS", "OpenAI", "Anthropic", "Azure"];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 font-sans">

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden text-white">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/15 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
      </div>

      {/* Header */}
      <header className="px-6 h-20 flex items-center justify-between border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform duration-300">
            <Shield className="text-white w-6 h-6" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-white">
            UNO<span className="text-indigo-500">.KERNEL</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-widest leading-none">
          <Link href="/docs/quickstart" className="text-slate-400 hover:text-white transition-colors">Docs</Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="#features" className="text-slate-400 hover:text-white transition-colors">Features</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
            Login
          </Link>
          <Button asChild className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-500 text-white border-none font-bold uppercase tracking-widest text-xs h-10 shadow-lg shadow-indigo-600/20">
            <Link href="/register">Deploy Kernel</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-hidden">

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-widest mb-10 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <Zap className="w-3 h-3 fill-indigo-400" /> Kernel Sovereign — v2.8.4
            </div>

            <h1 className="text-6xl md:text-[120px] font-black tracking-tighter mb-8 leading-[0.85] text-white">
              ORQUESTRE OS <br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent italic">GIGANTES.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
              Transforme Stripe, Google e GitHub em componentes de um <span className="text-white border-b-2 border-indigo-500/50">ecossistema soberano.</span>
              Uma única API. Controle absoluto.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-white text-black hover:bg-slate-200 text-lg font-black uppercase tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-2xl">
                <Link href="/register">
                  Criar Identidade <ArrowRight className="ml-2 w-6 h-6" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-16 px-12 rounded-2xl border-white/10 hover:bg-white/5 text-lg font-black uppercase tracking-tighter text-white transition-all">
                <Link href="/docs/quickstart">Explorar Guia</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Giant Tamers Section */}
        <section className="py-20 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-12 text-center">DOMESTICANDO O CAOS DOS PROVEDORES</p>
            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
              {giants.map(g => (
                <span key={g} className="text-2xl font-black tracking-tighter text-slate-200">{g}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-40 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">Capacidades do <span className="text-indigo-500">Kernel</span></h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">Tudo o que você precisa para escalar sem lidar com a complexidade da infraestrutura.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group p-10 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-indigo-600/5 hover:border-indigo-500/20 transition-all duration-500 relative"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500", feature.bg)}>
                  <feature.icon className={cn("w-8 h-8", feature.color)} />
                </div>
                <h3 className="text-2xl font-black mb-4 text-white uppercase tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  {feature.description}
                </p>
                <div className="absolute top-8 right-8 text-[10px] font-black text-white/5 uppercase tracking-tighter group-hover:text-indigo-500/20 transition-colors">
                  {idx + 1} / 06
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 px-6">
          <div className="max-w-5xl mx-auto p-12 md:p-24 rounded-[40px] bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden text-center space-y-8 shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                O futuro é <br /> <span className="text-indigo-200">SOBERANO.</span>
              </h2>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto font-medium">
                Pare de construir gateways de pagamento e autenticação do zero. Use o UNO e foque no que realmente importa: seu produto.
              </p>
              <div className="pt-8">
                <Button asChild size="lg" className="h-20 px-16 rounded-3xl bg-white text-indigo-600 hover:bg-slate-100 text-xl font-black uppercase tracking-tighter transition-all hover:scale-105 shadow-2xl">
                  <Link href="/register">Implementar Kernel Agora</Link>
                </Button>
              </div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-400/20 blur-[80px] rounded-full" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-32 px-6 border-t border-white/5 bg-[#01030d] text-[10px] font-black uppercase tracking-widest text-slate-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-tighter">UNO.KERNEL</span>
            </div>
            <p className="text-xs normal-case text-slate-400 font-medium max-w-xs leading-relaxed">
              Elevando o padrão de infraestrutura para aplicações resilientes,
              soberanas e inteligentes.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-white">Explorar</p>
            <ul className="space-y-2 font-bold text-slate-600">
              <li className="hover:text-indigo-400 transition-colors"><Link href="/docs/quickstart">Quickstart</Link></li>
              <li className="hover:text-indigo-400 transition-colors"><Link href="/docs/api/v1">API Reference</Link></li>
              <li className="hover:text-indigo-400 transition-colors"><Link href="/docs/sdks">SDK Downloads</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-white">Kernel Status</p>
            <div className="flex items-center gap-2 text-emerald-500 font-bold">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              99.9% Uptime
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2026 UNO Sovereign Kernels Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white">Privacy Policy</Link>
            <Link href="#" className="hover:text-white">Terms of Registry</Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
