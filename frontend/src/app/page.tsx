"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Lock, Globe, Server, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Shield,
    title: "Sovereign Governance",
    description: "Every event is validated, audited, and attributed before it touches your logic.",
  },
  {
    icon: Zap,
    title: "Event-Driven Billing",
    description: "Monetize arbitrary events with precision. Internal ledger connected to Stripe.",
  },
  {
    icon: Lock,
    title: "Identity Kernel",
    description: "Apps are first-class citizens. Secure machine-to-machine authentication.",
  },
  {
    icon: Activity,
    title: "Observability",
    description: "Real-time insights into system health, decision timelines, and audit trails.",
  },
  {
    icon: Server,
    title: "Infrastructure as Code",
    description: "Built on Go, deployed on Fly.io. Scalable, robust, and production-ready.",
  },
  {
    icon: Globe,
    title: "Federated Auth",
    description: "Google OAuth integration for human administrators and developers.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">

      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="font-bold text-xl tracking-tighter flex items-center gap-2">
          <div className="h-6 w-6 bg-primary rounded-full" />
          PROST-QS
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
            Documentation
          </Link>
          <Link href="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            Console Login
          </Link>
        </nav>
      </header>

      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 heading-gradient">
              The OS for Intelligent Systems
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Governance, Billing, and Identity for the next generation of AI applications.
              Built for control. Designed for scale.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3 bg-foreground text-background rounded-full font-semibold text-lg hover:scale-105 transition-transform duration-200 flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 border border-border rounded-full font-medium text-lg hover:bg-muted/50 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>

          {/* Abstract Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-20 relative h-64 md:h-96 w-full max-w-5xl mx-auto rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,transparent,black)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative z-10 flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
              {'< System_Ready state="ACTIVE" />'}
            </div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">Core Capabilities</h2>
            <p className="text-muted-foreground text-lg">Everything you need to govern chaos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-6 rounded-xl hover:bg-white/5"
              >
                <feature.icon className="w-10 h-10 mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-background text-sm text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="h-4 w-4 bg-primary rounded-full" /> PROST-QS
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Twitter</Link>
          </div>
          <div>
            &copy; 2026 PROST-QS Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
