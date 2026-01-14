import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/Button';

interface ShortcutItem {
    keys: string[];
    description: string;
}

const shortcuts: ShortcutItem[] = [
    { keys: ['Ctrl', 'K'], description: 'Busca global' },
    { keys: ['Ctrl', 'H'], description: 'Ir para Dashboard' },
    { keys: ['Ctrl', 'Shift', 'P'], description: 'Ir para Perfil' },
    { keys: ['?'], description: 'Mostrar atalhos de teclado' },
    { keys: ['Esc'], description: 'Fechar modal/dialog' },
];

export const KeyboardShortcutsHelp: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger when typing in inputs
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setIsOpen(true);
            }

            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                title="Atalhos de teclado (?)"
            >
                <Keyboard className="w-4 h-4" />
                <span className="hidden lg:inline text-xs">Atalhos</span>
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-lg shadow-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Keyboard className="w-5 h-5" />
                                    Atalhos de Teclado
                                </h2>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {shortcuts.map((shortcut, index) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                        <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <React.Fragment key={keyIndex}>
                                                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
                                                        {key}
                                                    </kbd>
                                                    {keyIndex < shortcut.keys.length - 1 && (
                                                        <span className="text-muted-foreground">+</span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 text-xs text-muted-foreground text-center">
                                Pressione <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded border border-border">Esc</kbd> para fechar
                            </p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
