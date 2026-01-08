
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, Globe, Shield, Terminal as TerminalIcon, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Box, label: 'Aplicações', href: '/projects' },
  { icon: Globe, label: 'Domínios', href: '/domains' },
  { icon: Shield, label: 'Segurança', href: '/security' },
  { icon: TerminalIcon, label: 'Engine Logs', href: '/logs' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 h-screen sticky top-0 bg-slate-950/80 backdrop-blur-xl p-6 flex flex-col">
      <div className="mb-10 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Box className="text-black w-5 h-5" />
        </div>
        <span className="font-bold text-lg tracking-tighter">MANIFEST SCE</span>
      </div>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                isActive 
                  ? "bg-primary text-black font-semibold shadow-[0_0_15px_rgba(0,242,255,0.3)]" 
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-black" : "group-hover:text-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
            AS
          </div>
          <div>
            <p className="text-sm font-medium">Arquiteto Supremo</p>
            <p className="text-xs text-slate-500">Privilégio: Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
