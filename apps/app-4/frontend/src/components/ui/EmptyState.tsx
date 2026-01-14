import { ReactNode } from "react";
import { motion } from "framer-motion";
import { FileX, Calendar, Search, Inbox, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/shadcn/Button";

interface EmptyStateProps {
    icon?: React.ElementType;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    children?: ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, children }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
                <p className="text-muted-foreground max-w-sm mb-4">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick}>{action.label}</Button>
            )}
            {children}
        </motion.div>
    );
}

// Pre-configured empty states
export function NoAppointments({ onBook }: { onBook?: () => void }) {
    return (
        <EmptyState
            icon={Calendar}
            title="Nenhuma consulta encontrada"
            description="Você ainda não tem consultas agendadas."
            action={onBook ? { label: "Agendar Consulta", onClick: onBook } : undefined}
        />
    );
}

export function NoResults() {
    return (
        <EmptyState
            icon={Search}
            title="Nenhum resultado"
            description="Tente ajustar os filtros ou termos de busca."
        />
    );
}

export function NoRecords() {
    return (
        <EmptyState
            icon={FileText}
            title="Nenhum registro encontrado"
            description="Não há registros para exibir no momento."
        />
    );
}

export function NoUsers() {
    return (
        <EmptyState
            icon={Users}
            title="Nenhum usuário encontrado"
            description="Não há usuários cadastrados com os filtros selecionados."
        />
    );
}
