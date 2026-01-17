"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, Zap, Lock, Activity, CheckCircle2, Cpu, Database, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Governança Soberana",
    description: "Valide cada evento antes que ele toque sua lógica. O ProstQS atua como um firewall inteligente para o seu business core.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10"
  },
  {
    icon: Zap,
    title: "Kernel Econômico",
    description: "Monetize qualquer ação. Orquestração nativa de Stripe e Mercado Pago com ledger imutável.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10"
  },
  {
    icon: Fingerprint,
    title: "Identidade Federada",
    description: "User, App e Agent são cidadãos de primeira classe. Autenticação soberana sem depender de silos.",
    color: "text-blue-400",
    bg: "bg-blue-500/10"
  },
  {
    icon: Activity,
    title: "Observabilidade Total",
    description: "Dashboard cognitivo com telemetria em tempo real de cada decisão tomada pelo kernel.",
    color: "text-amber-400",
    bg: "bg-amber-500/10"
  },
  {
    icon: Cpu,
    title: "Orquestração de Agentes",
    description: "Governe agentes de IA com guardrails humanos. O agente propõe, o kernel valida.",
    color: "text-rose-400",
    bg: "bg-rose-500/10"
  },
  {
    icon: Database,
    title: "Financial Pipeline",
    description: "Pipeline resiliente com retentativas inteligentes e reconciliação automática.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10"
  },
];

const giants = ["Stripe", "Google", "GitHub", "AWS", "OpenAI", "Anthropic", "Mercado Pago"];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 px-6 backdrop-blur-xl border-b border-border bg-background/80">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)] group-hover:bg-indigo-500/20 transition-all">
              <Shield className="text-indigo-400 w-5 h-5" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white">
              ProstQS<span className="text-indigo-500">.KERNEL</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/docs/quickstart" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">DOCS</Link>
            <Link href="#features" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">FEATURES</Link>
            <Link href="/login" className="text-sm font-bold text-white hover:text-indigo-400 transition-colors">LOGIN</Link>
            <Button asChild className="bg-white text-black hover:bg-slate-200 rounded-full px-6 font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <Link href="/register">DEPLOY KERNEL</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative min-h-[95vh] flex items-center pt-20 overflow-hidden">
          {/* Subtle Global Background Glows */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                System Online v3.0
              </div>

              <h1 className="text-6xl md:text-8xl lg:text-[90px] font-black text-white leading-[0.9] tracking-tighter mb-8 drop-shadow-2xl">
                KERNEL <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient">SOBERANO.</span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 max-w-xl font-light leading-relaxed mb-10 drop-shadow-md">
                Controle absoluto sobre Identidade, Billing e Governança.
                <strong className="text-white font-bold ml-1">ProstQS</strong> unifica sua infraestrutura fragmentada em um único núcleo inteligente.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="h-14 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:scale-105">
                  <Link href="/register">Começar Gratuitamente <ArrowRight className="ml-2 w-5 h-5" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 rounded-xl border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white font-bold text-lg transition-all">
                  <Link href="/docs/quickstart">Documentação</Link>
                </Button>
              </div>
            </motion.div>

            {/* Right Content: Focused Image with Energy Effects */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Energy Ring / Aura behind the photo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] z-0">
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                    opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-full h-full border border-indigo-500/20 rounded-full blur-sm"
                />
                <motion.div
                  animate={{
                    rotate: -360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 15, repeat: Infinity, ease: "linear" },
                    scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute inset-0 border border-purple-500/10 rounded-full blur-md"
                />
              </div>

              {/* Energy Sparks / Particles Container (Layered above and around) */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8]"
                    initial={{
                      x: "50%",
                      y: "50%",
                      opacity: 0
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 120}%`,
                      y: `${50 + (Math.random() - 0.5) * 120}%`,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>

              {/* The Photo Container with Frame */}
              <div className="relative z-10 p-2 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-indigo-500/30 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.5)]">
                <div className="relative w-80 h-80 md:w-[400px] md:h-[400px] rounded-[2rem] overflow-hidden border border-white/5 bg-[#0a0a0f]">
                  <Image
                    src="/images/prostqs_hero.png"
                    alt="ProstQS Sovereign Core"
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Internal Glow on the photo edges */}
                  <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" />

                  {/* Moving Light Overlay (Energy Layer Above Photo) */}
                  <motion.div
                    animate={{
                      x: ['-100%', '200%'],
                      opacity: [0, 0.3, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut"
                    }}
                    className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent skew-x-12 z-20"
                  />
                </div>
              </div>

              {/* Energy Rays exiting the frame */}
              <div className="absolute -top-10 -right-10 w-40 h-1 bg-gradient-to-r from-indigo-500/50 to-transparent blur-sm rotate-45 z-20" />
              <div className="absolute -bottom-10 -left-10 w-40 h-1 bg-gradient-to-r from-transparent to-purple-500/50 blur-sm rotate-45 z-20" />
            </motion.div>
          </div>
        </section>

        {/* LOGO STRIP */}
        <div className="border-y border-white/5 bg-white/[0.02] py-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-8">INTEGRAÇÕES NATIVAS</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              {giants.map(g => (
                <span key={g} className="text-xl font-bold text-slate-300">{g}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ARCHITECTURE SECTION */}
        <section className="py-32 px-6 bg-muted/20">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-3xl rounded-full" />
              <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl bg-card">
                <Image
                  src="/images/prostqs_architecture.png"
                  alt="ProstQS Architecture Diagram"
                  width={800}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">O Sistema Operacional do seu Negócio</h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Chega de "colcha de retalhos". O <strong className="text-white">ProstQS</strong> centraliza a lógica crítica que hoje está espalhada entre microserviços, lambdas e provedores SaaS.
              </p>

              <div className="space-y-6">
                {[
                  { title: "Gateway Unificado", desc: "Uma API para governar todos os seus serviços externos." },
                  { title: "Audit Log Imutável", desc: "Cada decisão e transação financeira é registrada para sempre." },
                  { title: "Zero Lock-in", desc: "Sua lógica de negócio pertence a você, não aos provedores." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                      <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-white text-lg">{item.title}</h3>
                      <p className="text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6">Módulos <span className="text-indigo-500">Core</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Funcionalidades avançadas prontas para uso. Deixe a infraestrutura conosco.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className={cn("inline-flex p-3 rounded-xl mb-6 shadow-lg", feature.bg)}>
                  <feature.icon className={cn("w-6 h-6", feature.color)} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto relative rounded-[3rem] overflow-hidden bg-indigo-600 text-center py-24 px-6 md:px-12 shadow-[0_0_100px_-20px_rgba(79,70,229,0.5)]">
            <div className="absolute inset-0 bg-[url('/images/prostqs_hero.png')] opacity-30 bg-cover bg-center mix-blend-overlay" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
                Retome o Controle.
              </h2>
              <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto">
                Junte-se a centenas de empresas que escolheram a soberania digital.
                Implante o ProstQS Kernel hoje mesmo.
              </p>
              <div className="pt-4">
                <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-white text-indigo-900 font-black uppercase tracking-widest hover:scale-105 shadow-xl transition-transform border-4 border-indigo-200/20">
                  <Link href="/register">Criar Conta Grátis</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-border bg-card text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center">
                <Shield className="text-indigo-500 w-5 h-5" />
              </div>
              <span className="font-black text-xl text-white tracking-tight">ProstQS.KERNEL</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              Infraestrutura soberana para a próxima geração de empresas digitais.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">Features</li>
              <li className="hover:text-white cursor-pointer transition-colors">Pricing</li>
              <li className="hover:text-white cursor-pointer transition-colors">Documentation</li>
              <li className="hover:text-white cursor-pointer transition-colors">Changelog</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-white cursor-pointer transition-colors">Privacy</li>
              <li className="hover:text-white cursor-pointer transition-colors">Terms</li>
              <li className="hover:text-white cursor-pointer transition-colors">Security</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 text-xs font-mono text-center md:text-left">
          © 2026 ProstQS Sovereign Tech. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
