/**
 * STATE CARD - Card visual para métricas e estados
 * 
 * Usa o vocabulário visual unificado de system-states.ts
 */

import { cn } from "@/lib/utils";
import { StateColors, SystemState, formatNumber } from "@/lib/system-states";
import { LucideIcon } from "lucide-react";

interface StateCardProps {
  state?: SystemState;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  pulse?: boolean;
  className?: string;
}

export function StateCard({ 
  state = "neutral",
  title, 
  value, 
  subtitle,
  icon: Icon,
  pulse = false,
  className 
}: StateCardProps) {
  const colors = StateColors[state];
  
  return (
    <div className={cn(
      "p-5 rounded-2xl border transition-all",
      colors.bg,
      colors.border,
      "hover:border-opacity-50",
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        {Icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            colors.bg
          )}>
            <Icon className={cn("w-5 h-5", colors.icon)} />
          </div>
        )}
        {pulse && (
          <div className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            colors.pulse
          )} />
        )}
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          {title}
        </span>
      </div>
      <p className={cn("text-3xl font-black", colors.text)}>
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// Cards pré-configurados para métricas comuns

interface MetricCardProps {
  value: number;
  subtitle?: string;
}

export function EventsCard({ value, subtitle = "eventos" }: MetricCardProps) {
  return (
    <StateCard
      state={value > 0 ? "success" : "inactive"}
      title="Eventos"
      value={value}
      subtitle={subtitle}
      pulse={value > 0}
    />
  );
}

export function RulesCard({ 
  active, 
  total 
}: { 
  active: number; 
  total: number;
}) {
  return (
    <StateCard
      state={active > 0 ? "neutral" : "inactive"}
      title="Regras Ativas"
      value={`${active}/${total}`}
      subtitle="regras configuradas"
    />
  );
}

export function ExecutionsCard({ 
  success, 
  failed 
}: { 
  success: number; 
  failed: number;
}) {
  const total = success + failed;
  const state: SystemState = failed > 0 ? "warning" : total > 0 ? "success" : "inactive";
  
  return (
    <StateCard
      state={state}
      title="Execuções"
      value={total}
      subtitle={failed > 0 ? `${failed} falhas` : "todas com sucesso"}
    />
  );
}
