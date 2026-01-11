/**
 * STATE BADGE - Badge visual para estados do sistema
 * 
 * Usa o vocabulário visual unificado de system-states.ts
 */

import { cn } from "@/lib/utils";
import { StateColors, SystemState } from "@/lib/system-states";
import { 
  CheckCircle2, XCircle, AlertTriangle, Ghost, 
  Clock, Power, Shield, Brain, Zap, Activity,
  Eye, EyeOff, RotateCcw, LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  success: CheckCircle2,
  failure: XCircle,
  warning: AlertTriangle,
  simulation: Ghost,
  neutral: Activity,
  inactive: Clock,
  // Específicos
  killswitch: Power,
  protection: Shield,
  cognition: Brain,
  action: Zap,
  observing: Eye,
  notObserving: EyeOff,
  retry: RotateCcw,
};

interface StateBadgeProps {
  state: SystemState;
  label: string;
  icon?: keyof typeof iconMap;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function StateBadge({ 
  state, 
  label, 
  icon,
  size = "sm",
  showIcon = true,
  className 
}: StateBadgeProps) {
  const colors = StateColors[state];
  const IconComponent = iconMap[icon || state];
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider",
      colors.badge,
      sizeClasses[size],
      className
    )}>
      {showIcon && IconComponent && (
        <IconComponent className={iconSizes[size]} />
      )}
      {label}
    </span>
  );
}

// Badges pré-configurados para estados comuns

export function SuccessBadge({ label = "Sucesso" }: { label?: string }) {
  return <StateBadge state="success" label={label} />;
}

export function FailureBadge({ label = "Falhou" }: { label?: string }) {
  return <StateBadge state="failure" label={label} />;
}

export function SimulationBadge({ label = "Simulado" }: { label?: string }) {
  return <StateBadge state="simulation" label={label} icon="simulation" />;
}

export function BlockedBadge({ label = "Bloqueado" }: { label?: string }) {
  return <StateBadge state="warning" label={label} />;
}

export function PendingBadge({ label = "Pendente" }: { label?: string }) {
  return <StateBadge state="inactive" label={label} />;
}

// Badge para status HTTP
export function HttpStatusBadge({ 
  method = "POST", 
  statusCode 
}: { 
  method?: string; 
  statusCode?: number;
}) {
  let state: SystemState = "inactive";
  if (statusCode) {
    if (statusCode >= 200 && statusCode < 300) state = "success";
    else if (statusCode >= 400 && statusCode < 500) state = "warning";
    else if (statusCode >= 500) state = "failure";
  }
  
  return (
    <StateBadge 
      state={state} 
      label={`${method} ${statusCode || "ERR"}`}
      showIcon={false}
    />
  );
}

// Badge para modo do sistema
export function SystemModeBadge({ 
  mode 
}: { 
  mode: "normal" | "shadow" | "killswitch";
}) {
  const configs = {
    normal: { state: "success" as SystemState, label: "Operacional", icon: "protection" as const },
    shadow: { state: "simulation" as SystemState, label: "Shadow", icon: "simulation" as const },
    killswitch: { state: "failure" as SystemState, label: "Kill Switch", icon: "killswitch" as const },
  };
  
  const config = configs[mode];
  return <StateBadge state={config.state} label={config.label} icon={config.icon} />;
}
