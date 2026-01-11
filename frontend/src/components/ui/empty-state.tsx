/**
 * EMPTY STATE - Estados vazios consistentes
 * 
 * Quando não há dados, mostrar de forma clara e útil.
 */

import { cn } from "@/lib/utils";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Inbox,
  title, 
  description,
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "text-center py-16 px-8 border-2 border-dashed border-white/5 rounded-3xl",
      className
    )}>
      <Icon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <Button 
          onClick={action.onClick}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Empty states pré-configurados

export function NoDataState({ 
  entity = "dados",
  onAction,
  actionLabel = "Criar"
}: { 
  entity?: string;
  onAction?: () => void;
  actionLabel?: string;
}) {
  return (
    <EmptyState
      title={`Nenhum ${entity} encontrado`}
      description={`Não há ${entity} para exibir no momento.`}
      action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
    />
  );
}

export function NoEventsState() {
  return (
    <EmptyState
      title="Nenhum evento ainda"
      description="Eventos aparecerão aqui quando seu app começar a enviar dados."
    />
  );
}

export function NoRulesState({ onCreateRule }: { onCreateRule?: () => void }) {
  return (
    <EmptyState
      title="Nenhuma regra criada"
      description="Crie regras para automatizar ações baseadas em eventos do seu app."
      action={onCreateRule ? { label: "Criar Regra", onClick: onCreateRule } : undefined}
    />
  );
}

export function NoExecutionsState() {
  return (
    <EmptyState
      title="Nenhuma execução registrada"
      description="Quando regras dispararem ações, o histórico aparecerá aqui."
    />
  );
}

export function NoWebhooksState() {
  return (
    <EmptyState
      title="Nenhum webhook executado"
      description="Configure regras com ação webhook para ver chamadas externas aqui."
    />
  );
}

export function SelectAppState() {
  return (
    <EmptyState
      title="Selecione um App"
      description="Use o seletor acima para escolher um app e ver seus dados."
    />
  );
}
