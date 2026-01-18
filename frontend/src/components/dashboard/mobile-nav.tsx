"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Fecha o menu quando a rota muda
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Bloqueia o scroll do body quando o menu está aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => { document.body.style.overflow = "auto"; };
    }, [isOpen]);

    return (
        <>
            {/* Toggle Button - Só visível no mobile */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Overlay & Sidebar */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-300 md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            >
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 w-64 h-full bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-in-out transform",
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar dentro do sidebar
                >
                    <div className="absolute top-2 right-2 z-50 md:hidden">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {/* Reutiliza o Sidebar existente, forçando display flex */}
                    <Sidebar className="w-full h-full flex" />
                </div>
            </div>
        </>
    );
}
