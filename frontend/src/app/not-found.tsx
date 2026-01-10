"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-8 relative z-10"
            >
                <div className="space-y-4">
                    <h1 className="text-[180px] font-black tracking-tighter text-white/5 leading-none select-none">
                        404
                    </h1>
                    <div className="space-y-2 -mt-20">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
                            Rota <span className="text-indigo-500">Não Encontrada</span>
                        </h2>
                        <p className="text-slate-500 font-medium max-w-md mx-auto">
                            O recurso que você está procurando não existe ou foi movido para outro lugar no kernel.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button 
                        onClick={() => window.history.back()}
                        variant="outline"
                        className="h-12 px-6 rounded-xl border-white/10 text-white hover:bg-white/5 font-bold"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar
                    </Button>
                    <Link href="/">
                        <Button className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                            <Home className="w-4 h-4 mr-2" />
                            Ir para Home
                        </Button>
                    </Link>
                    <Link href="/docs">
                        <Button 
                            variant="outline"
                            className="h-12 px-6 rounded-xl border-white/10 text-white hover:bg-white/5 font-bold"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Explorar Docs
                        </Button>
                    </Link>
                </div>

                <div className="pt-8 border-t border-white/5 max-w-md mx-auto">
                    <p className="text-xs text-slate-600 font-medium">
                        Se você acredita que isso é um erro, entre em contato com o suporte ou verifique a{" "}
                        <Link href="/docs" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                            documentação
                        </Link>
                        .
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
