import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import { Search, X, Calendar, User, FileText, Pill, ClipboardList, Settings } from "lucide-react";
import { Input } from "@/components/ui/shadcn/Input";
import { useAuthStore } from "@/hooks/useAuthStore";

interface SearchResult {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    category: string;
}

const allPages: SearchResult[] = [
    // Paciente
    { id: "book", title: "Agendar Consulta", description: "Marque uma nova consulta", icon: Calendar, href: "/paciente/book-appointment", category: "Paciente" },
    { id: "appointments", title: "Meus Agendamentos", description: "Ver consultas agendadas", icon: Calendar, href: "/paciente/my-appointments", category: "Paciente" },
    { id: "recurring", title: "Consultas Recorrentes", description: "Gerenciar consultas periódicas", icon: Calendar, href: "/paciente/recurring-appointments", category: "Paciente" },
    { id: "history", title: "Histórico Médico", description: "Ver prontuários e diagnósticos", icon: FileText, href: "/paciente/medical-history", category: "Paciente" },
    { id: "prescriptions-p", title: "Minhas Receitas", description: "Ver receitas médicas", icon: Pill, href: "/paciente/prescriptions", category: "Paciente" },
    { id: "certificates-p", title: "Meus Atestados", description: "Ver atestados médicos", icon: ClipboardList, href: "/paciente/certificates", category: "Paciente" },
    // Médico
    { id: "agenda", title: "Minha Agenda", description: "Ver agenda de consultas", icon: Calendar, href: "/medico/dashboard", category: "Médico" },
    { id: "waiting", title: "Sala de Espera", description: "Pacientes aguardando", icon: User, href: "/medico/waiting-room", category: "Médico" },
    { id: "records", title: "Prontuários", description: "Gerenciar prontuários", icon: FileText, href: "/medico/medical-records", category: "Médico" },
    { id: "prescriptions-m", title: "Receitas", description: "Emitir receitas", icon: Pill, href: "/medico/prescriptions", category: "Médico" },
    { id: "certificates-m", title: "Atestados", description: "Emitir atestados", icon: ClipboardList, href: "/medico/certificates", category: "Médico" },
    { id: "blocks", title: "Bloqueios de Agenda", description: "Gerenciar indisponibilidades", icon: Calendar, href: "/medico/schedule-blocks", category: "Médico" },
    // Comum
    { id: "profile", title: "Meu Perfil", description: "Editar dados pessoais", icon: User, href: "/profile", category: "Conta" },
    { id: "chat", title: "Chat", description: "Mensagens", icon: User, href: "/chat", category: "Conta" },
    // Ajuda
    { id: "faq", title: "FAQ", description: "Perguntas frequentes", icon: Settings, href: "/faq", category: "Ajuda" },
    { id: "contact", title: "Contato", description: "Fale conosco", icon: Settings, href: "/contact", category: "Ajuda" },
];


export function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { role } = useAuthStore();

    // Filter pages based on user role
    const getAvailablePages = () => {
        const roleStr = typeof role === 'object' ? (role as any)?.name : role;
        return allPages.filter(page => {
            if (roleStr === "ADMIN") return true;
            if (roleStr === "MEDICO") return page.category !== "Paciente";
            if (roleStr === "PACIENTE") return page.category !== "Médico";
            return page.category === "Ajuda" || page.category === "Conta";
        });
    };

    // Keyboard shortcut (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Search logic
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const available = getAvailablePages();
        const filtered = available.filter(
            page =>
                page.title.toLowerCase().includes(query.toLowerCase()) ||
                page.description.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
    }, [query, role]);

    const handleSelect = (result: SearchResult) => {
        router.push(result.href);
        setIsOpen(false);
        setQuery("");
    };

    return (
        <>
            {/* Search Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
                aria-label="Buscar (Ctrl+K)"
            >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-background rounded border">
                    <span>⌘</span>K
                </kbd>
            </button>

            {/* Search Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-background rounded-lg shadow-2xl z-50 overflow-hidden"
                        >
                            {/* Search Input */}
                            <div className="flex items-center gap-3 p-4 border-b">
                                <Search className="w-5 h-5 text-muted-foreground" />
                                <Input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Buscar páginas..."
                                    className="border-0 focus-visible:ring-0 p-0 text-lg"
                                />
                                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Results */}
                            <div className="max-h-80 overflow-y-auto">
                                {results.length > 0 ? (
                                    <div className="p-2">
                                        {results.map((result) => (
                                            <button
                                                key={result.id}
                                                onClick={() => handleSelect(result)}
                                                className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted text-left transition-colors"
                                            >
                                                <result.icon className="w-5 h-5 text-primary" />
                                                <div>
                                                    <p className="font-medium">{result.title}</p>
                                                    <p className="text-sm text-muted-foreground">{result.description}</p>
                                                </div>
                                                <span className="ml-auto text-xs text-muted-foreground">{result.category}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : query ? (
                                    <p className="p-4 text-center text-muted-foreground">Nenhum resultado encontrado</p>
                                ) : (
                                    <p className="p-4 text-center text-muted-foreground">Digite para buscar...</p>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
