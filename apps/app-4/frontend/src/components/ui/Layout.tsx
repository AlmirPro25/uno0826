import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Menu, Home, Users, Calendar, Stethoscope, FileText, UserCircle, MessageCircle, Pill, ClipboardList, CreditCard, BarChart3, Star, CalendarOff, Bell, Settings, MapPin, Brain, Activity, ClipboardCheck, Ticket, Building2, PieChart } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Role } from '@/types/auth';
import { Button } from '@/components/ui/shadcn/Button';
import { ThemeToggle } from '@/components/ThemeToggle';

// --- Shadcn/UI Component Imports (simulated for brevity) ---
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/shadcn/Sheet';
import { CallNotification } from '@/components/CallNotification';
import { NotificationBell } from '@/components/NotificationBell';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { KeyboardShortcutsHelp } from '@/components/ui/KeyboardShortcutsHelp';
import { HelpWidget } from '@/components/ui/HelpWidget';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    roles: Role[];
}

const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["ADMIN", "MEDICO", "PACIENTE"] },
    { name: "Meu Perfil", href: "/profile", icon: UserCircle, roles: ["ADMIN", "MEDICO", "PACIENTE"] },
    { name: "Notificações", href: "/notifications", icon: Bell, roles: ["ADMIN", "MEDICO", "PACIENTE"] },
    { name: "Configurações", href: "/settings", icon: Settings, roles: ["ADMIN", "MEDICO", "PACIENTE"] },
    { name: "Chat", href: "/chat", icon: MessageCircle, roles: ["ADMIN", "MEDICO", "PACIENTE"] },
    // Admin
    { name: "Gerenciar Usuários", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
    { name: "Gerenciar Clínicas", href: "/admin/clinics", icon: Building2, roles: ["ADMIN"] },
    { name: "Analytics", href: "/admin/analytics", icon: PieChart, roles: ["ADMIN"] },
    { name: "Estatísticas", href: "/admin/stats", icon: BarChart3, roles: ["ADMIN"] },
    { name: "Relatórios", href: "/admin/reports", icon: FileText, roles: ["ADMIN"] },
    { name: "Auditoria", href: "/admin/audit", icon: FileText, roles: ["ADMIN"] },
    { name: "Triagens IA", href: "/admin/triagens", icon: Activity, roles: ["ADMIN"] },
    { name: "Config. Fila", href: "/admin/queue-settings", icon: Settings, roles: ["ADMIN"] },
    { name: "Histórico Fila", href: "/queue/history", icon: ClipboardList, roles: ["ADMIN"] },
    // Paciente
    { name: "Meu Painel", href: "/paciente/dashboard", icon: Home, roles: ["PACIENTE"] },
    { name: "Agendamentos", href: "/paciente/book-appointment", icon: Calendar, roles: ["PACIENTE"] },
    { name: "Meus Agendamentos", href: "/paciente/my-appointments", icon: Calendar, roles: ["PACIENTE"] },
    { name: "Consultas Recorrentes", href: "/paciente/recurring-appointments", icon: Calendar, roles: ["PACIENTE"] },
    { name: "Histórico Médico", href: "/paciente/medical-history", icon: FileText, roles: ["PACIENTE"] },
    { name: "Minhas Receitas", href: "/paciente/prescriptions", icon: Pill, roles: ["PACIENTE"] },
    { name: "Meus Atestados", href: "/paciente/certificates", icon: ClipboardList, roles: ["PACIENTE"] },
    { name: "Pagamentos", href: "/paciente/payments", icon: CreditCard, roles: ["PACIENTE"] },
    { name: "Avaliações", href: "/paciente/reviews", icon: Star, roles: ["PACIENTE"] },
    { name: "Minhas Triagens", href: "/paciente/triagens", icon: Activity, roles: ["PACIENTE"] },
    { name: "Minha Saúde", href: "/paciente/health", icon: Activity, roles: ["PACIENTE"] },
    { name: "Medicamentos", href: "/paciente/medications", icon: Pill, roles: ["PACIENTE"] },
    { name: "Meus Exames", href: "/paciente/exams", icon: FileText, roles: ["PACIENTE"] },
    { name: "Vacinas", href: "/paciente/vaccines", icon: ClipboardList, roles: ["PACIENTE"] },
    { name: "Fitness & NOVA", href: "/paciente/fitness", icon: Activity, roles: ["PACIENTE"] },
    { name: "Retirar Senha", href: "/queue/join", icon: Ticket, roles: ["PACIENTE"] },
    { name: "Acompanhar Senha", href: "/queue/track", icon: Activity, roles: ["PACIENTE"] },
    { name: "Rede Credenciada", href: "/clinics", icon: MapPin, roles: ["PACIENTE", "MEDICO", "ADMIN"] },
    { name: "Triagem Inteligente", href: "/ai/triage", icon: ClipboardCheck, roles: ["PACIENTE", "MEDICO", "ADMIN"] },
    { name: "MediCore Live", href: "/ai/medicore", icon: Brain, roles: ["PACIENTE", "MEDICO", "ADMIN"] },
    { name: "NeuroClinic AI", href: "/ai/neuroclinic", icon: Activity, roles: ["PACIENTE", "MEDICO", "ADMIN"] },
    { name: "SNDT Orquestrador", href: "/ai/sndt", icon: Brain, roles: ["MEDICO", "ADMIN"] },
    { name: "Telemedicina", href: "/telemedicine", icon: Stethoscope, roles: ["PACIENTE", "MEDICO", "ADMIN"] },

    // Médico
    { name: "Minha Agenda", href: "/medico/dashboard", icon: Calendar, roles: ["MEDICO"] },
    { name: "Bloqueios de Agenda", href: "/medico/schedule-blocks", icon: CalendarOff, roles: ["MEDICO"] },
    { name: "Sala de Espera", href: "/medico/waiting-room", icon: Stethoscope, roles: ["MEDICO"] },
    { name: "Painel de Fila", href: "/queue/panel", icon: Ticket, roles: ["MEDICO", "ADMIN"] },
    { name: "Prontuários", href: "/medico/medical-records", icon: FileText, roles: ["MEDICO"] },
    { name: "Receitas", href: "/medico/prescriptions", icon: Pill, roles: ["MEDICO"] },
    { name: "Atestados", href: "/medico/certificates", icon: ClipboardList, roles: ["MEDICO"] },
    { name: "Estatísticas", href: "/medico/stats", icon: BarChart3, roles: ["MEDICO"] },
    { name: "Relatórios", href: "/medico/reports", icon: FileText, roles: ["MEDICO"] },
    { name: "Avaliações", href: "/medico/reviews", icon: Star, roles: ["MEDICO"] },
    { name: "Fila de Triagem", href: "/medico/triagens", icon: Activity, roles: ["MEDICO"] },
];

interface LayoutProps {
    children: React.ReactNode;
}

const Sidebar: React.FC<{ role: Role | null; className?: string }> = ({ role, className }) => {
    const router = useRouter();
    // Handle role that might be object or string
    const roleString = typeof role === 'object' && role !== null ? (role as any).name : role;
    const filteredNavItems = navItems.filter(item => item.roles.includes(roleString || 'PACIENTE')); // Default to patient if role is null for logic

    return (
        <nav className={twMerge("flex flex-col space-y-2 px-4 py-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent", className)}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Stethoscope size={18} strokeWidth={2.5} />
                </div>
                <span className="text-gradient tracking-tight">MediSync</span>
            </h2>
            {filteredNavItems.map((item) => (
                <Link key={item.name} href={item.href} legacyBehavior>
                    <motion.a
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 cursor-pointer flex-shrink-0 ${router.pathname === item.href ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-white/5'
                            }`}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.name}</span>
                    </motion.a>
                </Link>
            ))}
        </nav>
    );
};

export const AppLayout: React.FC<LayoutProps> = ({ children }) => {
    const { role, logout } = useAuthStore();
    const router = useRouter();

    // Initialize keyboard shortcuts
    useKeyboardShortcuts();

    const handleLogout = () => {
        logout();
        router.push('/auth/login');
    };

    return (
        <div className="min-h-screen flex bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background">
            {/* Connection Status Banner */}
            <ConnectionStatus />

            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex w-64 border-r border-white/10 flex-col backdrop-blur-xl bg-background/30 fixed h-full z-20">
                <Sidebar role={role} />
                <div className="mt-auto p-4 border-t border-white/10 space-y-3">
                    <GlobalSearch />
                    <div className="flex items-center justify-between">
                        <ThemeToggle />
                        <KeyboardShortcutsHelp />
                        <NotificationBell />
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Spacer for fixed sidebar */}
            <div className="hidden md:block w-64 flex-shrink-0" />

            {/* Mobile Header with Sheet */}
            <div className="md:hidden fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-white/10 z-50 p-4 flex justify-between items-center shadow-lg shadow-black/5">
                <span className="font-bold text-lg text-gradient flex items-center gap-2">
                    <Stethoscope className="text-primary w-5 h-5" />
                    MediSync
                </span>
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <ThemeToggle />
                    <Sheet>
                        <SheetTrigger>
                            <Button variant="ghost" size="icon"><Menu /></Button>
                        </SheetTrigger>
                        <SheetContent className="bg-background/95 backdrop-blur-xl border-l border-white/10">
                            <Sidebar role={role} className="pt-12" />
                            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive mt-4 hover:bg-destructive/10" onClick={handleLogout}>
                                Sair
                            </Button>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 mt-16 md:mt-0 overflow-y-auto">
                <CallNotification />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {children}
                </motion.div>
            </main>

            {/* Help Widget */}
            <HelpWidget />
        </div>
    );
};

// Alias export for compatibility
export const Layout = AppLayout;
