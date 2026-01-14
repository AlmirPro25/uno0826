import { useEffect } from "react";
import { useRouter } from "next/router";
import {
    motion,
    useScroll,
    useTransform,
    useSpring
} from "framer-motion";
import { Button } from "@/components/ui/shadcn/Button";
import { useAuthStore } from "@/hooks/useAuthStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import {
    Brain,
    Activity,
    Zap,
    Play,
    ArrowRight,
    CheckCircle2,
    Network,
    Shield
} from "lucide-react";

// --- Components ---

const ScrollProgress = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 origin-left z-[100]"
            style={{ scaleX }}
        />
    );
};

const StatItem = ({ value, label, delay }: { value: string, label: string, delay: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay, type: "spring" }}
            viewport={{ once: true }}
            className="text-center p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-default"
        >
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 font-sans tracking-tight">
                {value}
            </div>
            <div className="text-sm md:text-base text-muted-foreground uppercase tracking-widest font-semibold">
                {label}
            </div>
        </motion.div>
    );
};

// --- Main Page ---

export default function LandingPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { scrollY } = useScroll();

    // Parallax transforms
    const heroY = useTransform(scrollY, [0, 1000], [0, 400]);

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    if (isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-sans transition-colors duration-300">
            <Head>
                <title>MediSync AI | Conectando Vidas, Transformando a Saúde</title>
                <meta name="description" content="A plataforma de saúde mais avançada do mundo. Conecte-se com especialistas e cuide da sua saúde com inteligência artificial." />
                <meta name="theme-color" content="#ffffff" />
            </Head>

            <ScrollProgress />

            {/* Navbar Glassmorphism */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="fixed top-0 w-full z-50 bg-background/80 dark:bg-[#030305]/80 backdrop-blur-xl border-b border-border/40 transition-all duration-300"
            >
                <div className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative w-10 h-10 flex items-center justify-center bg-primary rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20 text-primary-foreground">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-foreground">MediSync<span className="text-primary">.AI</span></span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-muted-foreground">
                        {['Plataforma', 'NeuroClinic', 'Enterprise', 'Roadmap'].map((item) => (
                            <Link key={item} href={`#${item.toLowerCase()}`} className="hover:text-primary transition-colors relative">
                                {item}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/auth/login">
                            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                                Login
                            </Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button className="rounded-full px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                Começar Agora
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.header>

            <main className="relative">

                {/* HERO SECTION - NEW HUMAN CENTRIC DESIGN */}
                <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                    {/* Background Image with Overlay */}
                    <motion.div
                        style={{ y: heroY }}
                        className="absolute inset-0 z-0 h-[120%]"
                    >
                        <Image
                            src="/hero-human-central.png"
                            alt="Médicos e pacientes conectados em ambiente profissional"
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Subtle gradient to ensure text readability without ruining the photo */}
                        <div className="absolute inset-0 bg-background/80 dark:bg-[#030305]/60 z-10" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
                    </motion.div>

                    <div className="container mx-auto px-6 relative z-20 pt-20 text-center">
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md shadow-lg"
                            >
                                <Zap className="w-4 h-4 fill-primary" />
                                O Futuro da Saúde, Hoje
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-8 leading-[1.1] drop-shadow-sm"
                            >
                                Conectando <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Pessoas & Medicina</span><br />
                                com Inteligência Avançada
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="text-xl md:text-2xl text-muted-foreground/90 max-w-3xl mx-auto mb-12 leading-relaxed font-light"
                            >
                                Unimos a expertise humana com o poder da IA. Um ecossistema completo onde médicos cuidam de você com suporte de dados em tempo real.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="flex flex-col sm:flex-row gap-6 justify-center"
                            >
                                <Link href="/auth/register">
                                    <Button size="lg" className="h-16 px-10 rounded-full text-lg shadow-xl hover:translate-y-[-2px] transition-all bg-primary text-primary-foreground hover:bg-primary/90">
                                        Começar Agora
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </Link>
                                <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-lg bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80">
                                    <Play className="mr-2 w-5 h-5 text-primary" />
                                    Ver Demonstração
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* STATS SECTION */}
                <section className="py-20 border-y border-border/50 bg-muted/30 relative z-20">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                            <StatItem value="99%" label="Satisfação" delay={0} />
                            <StatItem value="15k+" label="Pacientes Atendidos" delay={0.1} />
                            <StatItem value="24/7" label="Suporte Médico" delay={0.2} />
                            <StatItem value="4.9" label="Avaliação Média" delay={0.3} />
                        </div>
                    </div>
                </section>

                {/* DUAL ECOSYSTEM BANNER */}
                <section className="py-20 px-6 bg-background relative overflow-hidden">
                    <div className="container mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/50 group"
                        >
                            <div className="relative aspect-[21/9] w-full min-h-[500px]">
                                <Image
                                    src="/ecosystem-banner.png"
                                    alt="Ecossistema Completo: Treino Virtual e Medicina Online"
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 text-center text-white px-6">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.8 }}
                                        className="max-w-4xl"
                                    >
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-6">
                                            <Activity className="w-4 h-4 text-emerald-400" />
                                            Saúde Integral 360º
                                        </div>
                                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                                            Do Treino à <span className="text-blue-400">Consulta.</span>
                                        </h2>
                                        <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto font-light">
                                            Nossa IA cuida de você antes mesmo de adoecer. Personal Trainer Virtual para prevenção e Médicos Especialistas para tratamento. Tudo em um só app.
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            <Link href="/auth/register">
                                                <Button size="lg" className="rounded-full bg-white text-black hover:bg-gray-100 font-bold border-0 h-14 px-8 text-lg">
                                                    Começar Treino
                                                </Button>
                                            </Link>
                                            <Link href="/auth/register">
                                                <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 backdrop-blur-sm h-14 px-8 text-lg bg-black/20">
                                                    Agendar Médico
                                                </Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* NEUROCLINIC SECTION (The Tech) */}
                <section id="neuroclinic" className="py-32 px-6 relative overflow-hidden bg-background">
                    <div className="container mx-auto">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                            >
                                <div className="flex items-center gap-2 text-primary mb-6 font-mono text-sm tracking-wider">
                                    <Brain className="w-4 h-4" />
                                    NEUROCLINIC 2.0
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                                    Inteligência que entende o <span className="text-primary">ser humano.</span>
                                </h2>
                                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                    Nossa IA não substitui o médico, ela o potencializa. Durante sua consulta, o sistema analisa sintomas em tempo real, sugerindo diagnósticos precisos e permitindo que o doutor foque no que importa: você.
                                </p>

                                <ul className="space-y-4 mb-10">
                                    {[
                                        "Triagem instantânea antes da consulta",
                                        "Monitoramento de sinais vitais via câmera",
                                        "Histórico médico unificado e inteligente",
                                        "Prescrições digitais aceitas em todo país"
                                    ].map((item, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 + 0.5 }}
                                            viewport={{ once: true }}
                                            className="flex items-center gap-3 text-foreground/80 font-medium"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            {item}
                                        </motion.li>
                                    ))}
                                </ul>

                                <Button variant="secondary" className="rounded-full h-12 px-8">
                                    Conhecer a Tecnologia
                                </Button>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                                transition={{ duration: 1 }}
                                viewport={{ once: true }}
                                className="relative"
                            >
                                {/* Simulated Interface */}
                                <div className="rounded-2xl overflow-hidden border border-border shadow-2xl relative bg-card">
                                    <Image
                                        src="/neuro-interface.png"
                                        alt="NeuroClinic Interface"
                                        width={800}
                                        height={600}
                                        className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                                    />

                                    {/* Floating UI Elements Animation */}
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                        className="absolute top-10 right-10 glass p-4 rounded-xl max-w-[150px]"
                                    >
                                        <div className="text-xs text-muted-foreground mb-1">Precisão Estimada</div>
                                        <div className="text-2xl font-bold text-primary">99.2%</div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ROADMAP SECTION */}
                <section id="roadmap" className="py-32 bg-muted/30 relative">
                    <div className="container mx-auto px-6">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">O Futuro da Saúde</h2>
                            <p className="text-xl text-muted-foreground">
                                Estamos construindo hoje a medicina de amanhã. Confira nossa jornada de inovação.
                            </p>
                        </div>

                        <div className="relative">
                            {/* Central Line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border hidden md:block" />

                            <div className="space-y-32">
                                {[
                                    {
                                        phase: "FASE 1 - NO AR",
                                        title: "Telemedicina 360º",
                                        desc: "Consultas por vídeo de alta definição, chat seguro e prontuário digital integrado. A base da nossa revolução.",
                                        image: "/hero-dashboard.png",
                                        align: "left",
                                        color: "blue"
                                    },
                                    {
                                        phase: "EM BREVE - FASE 2",
                                        title: "Wearables Conectados",
                                        desc: "Integração direta com seu smartwatch. Monitoramento cardíaco contínuo e alertas automáticos de emergência.",
                                        image: "/wearable-future.png",
                                        align: "right",
                                        color: "emerald"
                                    },
                                    {
                                        phase: "FUTURO - FASE 3",
                                        title: "Diagnóstico Preditivo",
                                        desc: "Algoritmos que antecipam problemas de saúde antes dos sintomas aparecerem, baseados em genética e estilo de vida.",
                                        image: "/hero-ai.png",
                                        align: "left",
                                        color: "purple"
                                    }
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        className={`flex flex-col md:flex-row gap-12 items-center ${item.align === 'right' ? 'md:flex-row-reverse' : ''}`}
                                    >
                                        <div className="flex-1 text-center md:text-left bg-card p-8 rounded-3xl border border-border/50 shadow-sm relative z-10">
                                            <div className={`inline-block px-3 py-1 bg-${item.color}-500/10 border border-${item.color}-500/20 text-${item.color}-500 text-xs font-bold mb-4 rounded-full`}>
                                                {item.phase}
                                            </div>
                                            <h3 className="text-2xl font-bold mb-4 text-foreground">{item.title}</h3>
                                            <p className="text-muted-foreground text-lg leading-relaxed">{item.desc}</p>
                                        </div>

                                        <div className="relative w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden border border-border shadow-lg group bg-card">
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ENTERPRISE SECTION */}
                <section id="enterprise" className="py-32 px-6 bg-background">
                    <div className="container mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                            <div className="max-w-2xl">
                                <h2 className="text-4xl font-bold mb-4 text-foreground">Para Grandes Clínicas.</h2>
                                <p className="text-muted-foreground text-lg">
                                    Soluções robustas para hospitais e redes de saúde. Gestão de filas, triagem Manchester automática e conformidade total com LGPD.
                                </p>
                            </div>
                            <Button variant="outline" className="rounded-full">
                                Ver Soluções Corporativas
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                            <motion.div whileHover={{ scale: 1.02 }} className="md:col-span-2 rounded-3xl bg-card border border-border p-8 flex flex-col justify-between relative overflow-hidden shadow-sm">
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                                        <Network className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-foreground">Triagem Global Manchester</h3>
                                    <p className="text-muted-foreground mt-2 max-w-md">Classificação de risco automática integrada a filas de espera físicas e virtuais.</p>
                                </div>
                                <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-orange-500/5 to-transparent" />
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} className="rounded-3xl bg-card border border-border p-8 relative overflow-hidden group shadow-sm">
                                <div className="relative z-10">
                                    <Shield className="w-12 h-12 text-emerald-500 mb-4" />
                                    <h3 className="text-2xl font-bold text-foreground">Segurança Total</h3>
                                    <p className="text-muted-foreground mt-2">Criptografia de ponta a ponta e compliance LGPD nativo.</p>
                                </div>
                                <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.02 }} className="md:col-span-3 rounded-3xl bg-primary/5 border border-primary/10 p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-sm gap-6">
                                <div className="relative z-10 max-w-xl">
                                    <h3 className="text-3xl font-bold text-foreground mb-2">Analytics em Tempo Real</h3>
                                    <p className="text-muted-foreground">Tome decisões baseadas em dados. Ocupação de leitos, tempo de espera e satisfação do paciente ao vivo.</p>
                                </div>
                                <div className="relative z-10 shrink-0">
                                    <Button className="rounded-full shadow-lg h-12 px-8">Explorar Dashboard</Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="py-40 relative px-6 overflow-hidden bg-primary">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 10, repeat: Infinity }}
                        className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-white/10 rounded-full blur-[150px]"
                    />

                    <div className="container mx-auto relative z-10 text-center text-primary-foreground">
                        <h2 className="text-5xl md:text-8xl font-bold mb-8 tracking-tighter">
                            Comece agora.
                        </h2>
                        <p className="text-2xl opacity-90 mb-12 max-w-2xl mx-auto font-light">
                            Centenas de profissionais já estão transformando a saúde no Brasil.
                            Faça parte da revolução.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth/register">
                                <Button size="lg" className="h-20 px-12 text-xl rounded-full bg-white text-primary hover:bg-white/90 font-bold shadow-2xl">
                                    Criar Conta Gratuita
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="py-12 bg-card border-t border-border px-6">
                    <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <Activity className="w-5 h-5 text-primary" />
                            <span className="text-foreground font-bold">MediSync Inc.</span>
                        </div>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
                            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
                            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
                            <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
                        </div>
                        <div className="mt-4 md:mt-0">
                            © {new Date().getFullYear()} Todos os direitos reservados.
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
