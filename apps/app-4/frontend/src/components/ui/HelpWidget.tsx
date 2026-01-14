import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, MessageCircle, Book, Phone, Mail, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/Button';
import Link from 'next/link';

interface HelpItem {
    icon: React.ElementType;
    title: string;
    description: string;
    href?: string;
    action?: () => void;
}

const helpItems: HelpItem[] = [
    {
        icon: Book,
        title: 'FAQ',
        description: 'Perguntas frequentes',
        href: '/faq',
    },
    {
        icon: MessageCircle,
        title: 'Chat de Suporte',
        description: 'Fale com nossa equipe',
        href: '/contact',
    },
    {
        icon: Phone,
        title: 'Telefone',
        description: '0800 123 4567',
        action: () => window.open('tel:08001234567'),
    },
    {
        icon: Mail,
        title: 'Email',
        description: 'suporte@medisync.com.br',
        action: () => window.open('mailto:suporte@medisync.com.br'),
    },
];

export const HelpWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Ajuda"
            >
                <HelpCircle className="w-6 h-6" />
            </motion.button>

            {/* Help Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="fixed bottom-24 right-6 z-50 w-80 bg-background border rounded-lg shadow-xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-primary" />
                                    <h3 className="font-semibold">Precisa de ajuda?</h3>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-2">
                                {helpItems.map((item, index) => {
                                    const content = (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                            onClick={() => {
                                                if (item.action) {
                                                    item.action();
                                                }
                                                setIsOpen(false);
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <item.icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{item.title}</p>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {item.description}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </motion.div>
                                    );

                                    if (item.href) {
                                        return (
                                            <Link key={index} href={item.href} onClick={() => setIsOpen(false)}>
                                                {content}
                                            </Link>
                                        );
                                    }

                                    return content;
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t bg-muted/30">
                                <p className="text-xs text-muted-foreground text-center">
                                    Horário de atendimento: Seg-Sex, 8h às 18h
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
