import Link from "next/link";
import { useRouter } from "next/router";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[];
    className?: string;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    profile: "Perfil",
    chat: "Chat",
    paciente: "Paciente",
    medico: "Médico",
    admin: "Admin",
    "book-appointment": "Agendar Consulta",
    "my-appointments": "Meus Agendamentos",
    "recurring-appointments": "Consultas Recorrentes",
    "medical-history": "Histórico Médico",
    prescriptions: "Receitas",
    certificates: "Atestados",
    payments: "Pagamentos",
    reviews: "Avaliações",
    "waiting-room": "Sala de Espera",
    "medical-records": "Prontuários",
    "schedule-blocks": "Bloqueios de Agenda",
    stats: "Estatísticas",
    reports: "Relatórios",
    audit: "Auditoria",
    faq: "FAQ",
    contact: "Contato",
    terms: "Termos",
    privacy: "Privacidade",
    pricing: "Preços",
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    const router = useRouter();

    // Auto-generate breadcrumbs from path if items not provided
    const breadcrumbs = items || generateBreadcrumbs(router.pathname);

    if (breadcrumbs.length <= 1) return null;

    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm", className)}>
            <ol className="flex items-center gap-1">
                <li>
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Home className="w-4 h-4" />
                    </Link>
                </li>
                {breadcrumbs.map((item, index) => (
                    <li key={index} className="flex items-center gap-1">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        {item.href && index < breadcrumbs.length - 1 ? (
                            <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                                {item.label}
                            </Link>
                        ) : (
                            <span className="font-medium">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = "";

    for (const segment of segments) {
        currentPath += `/${segment}`;
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({ label, href: currentPath });
    }

    return breadcrumbs;
}
