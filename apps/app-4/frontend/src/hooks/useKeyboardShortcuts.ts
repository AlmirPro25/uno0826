import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";

interface ShortcutConfig {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts(customShortcuts?: ShortcutConfig[]) {
    const router = useRouter();

    const shortcuts: ShortcutConfig[] = [
        { key: "h", ctrl: true, action: () => router.push("/dashboard"), description: "Ir para Dashboard" },
        { key: "p", ctrl: true, shift: true, action: () => router.push("/profile"), description: "Ir para Perfil" },
        ...(customShortcuts || []),
    ];

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
            return;
        }

        for (const shortcut of shortcuts) {
            const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
            const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
            const altMatch = shortcut.alt ? event.altKey : !event.altKey;
            const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

            if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                event.preventDefault();
                shortcut.action();
                break;
            }
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    return shortcuts;
}

// Hook to show keyboard shortcuts help
export function useShortcutsHelp() {
    const shortcuts = [
        { keys: ["Ctrl", "K"], description: "Busca global" },
        { keys: ["Ctrl", "H"], description: "Ir para Dashboard" },
        { keys: ["Ctrl", "Shift", "P"], description: "Ir para Perfil" },
        { keys: ["Esc"], description: "Fechar modal/dialog" },
    ];

    return shortcuts;
}
