import { useState, useCallback } from "react";

interface ConfirmState {
    open: boolean;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    variant: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
}

const defaultState: ConfirmState = {
    open: false,
    title: "",
    description: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    variant: "default",
    onConfirm: () => {},
};

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>(defaultState);
    const [loading, setLoading] = useState(false);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                open: true,
                title: options.title,
                description: options.description,
                confirmText: options.confirmText || "Confirmar",
                cancelText: options.cancelText || "Cancelar",
                variant: options.variant || "default",
                onConfirm: () => resolve(true),
            });
        });
    }, []);

    const handleConfirm = useCallback(async () => {
        setLoading(true);
        try {
            await state.onConfirm();
        } finally {
            setLoading(false);
            setState(defaultState);
        }
    }, [state.onConfirm]);

    const handleCancel = useCallback(() => {
        setState(defaultState);
    }, []);

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setState(defaultState);
        }
    }, []);

    return {
        confirm,
        dialogProps: {
            open: state.open,
            onOpenChange: handleOpenChange,
            title: state.title,
            description: state.description,
            confirmText: state.confirmText,
            cancelText: state.cancelText,
            variant: state.variant,
            loading,
            onConfirm: handleConfirm,
            onCancel: handleCancel,
        },
    };
}
