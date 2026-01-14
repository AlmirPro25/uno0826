import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/shadcn/Input";
import { Button } from "@/components/ui/shadcn/Button";
import { Label } from "@/components/ui/shadcn/Label";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { useAuthStore } from "@/hooks/useAuthStore";
import { authAPI } from "@/api/auth";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Star, Activity, Stethoscope } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LoginForm {
    email: string;
    password: string;
}

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuthStore();
    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const testimonials = [
        {
            quote: "O MediSync revolucionou a forma como gerencio minha saúde. Consultas rápidas e histórico sempre à mão. Simplesmente incrível.",
            author: "Ana Beatriz",
            role: "Paciente desde 2023"
        },
        {
            quote: "Como médico, a organização que o MediSync proporciona é incomparável. Consigo focar 100% no paciente.",
            author: "Dr. Ricardo Silva",
            role: "Cardiologista"
        },
        {
            quote: "A segurança dos dados sempre foi minha preocupação, mas o MediSync me deu a tranquilidade que eu precisava.",
            author: "Marcos Oliveira",
            role: "Paciente"
        }
    ];

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authAPI.login(data.email, data.password);
            
            // Set token first so we can make authenticated requests
            const tempUser = {
                id: 0,
                email: data.email,
                fullName: "",
                role: response.role as any,
                isActive: true,
            };
            login(response.token, tempUser);

            if (response.refreshToken) {
                useAuthStore.getState().setRefreshToken(response.refreshToken);
            }

            // Fetch full user data with the new token directly in header
            try {
                const { axiosInstance } = await import('@/api/axios');
                const userResponse = await axiosInstance.get('/auth/me', {
                    headers: { Authorization: `Bearer ${response.token}` }
                });
                const userData = userResponse.data;
                // Update store with full user data
                login(response.token, {
                    ...userData,
                    role: response.role as any,
                });
            } catch (userErr) {
                // Continue even if we can't fetch user data
                console.warn("Could not fetch user data:", userErr);
            }

            // Redirect based on role or returnUrl
            const returnUrl = router.query.returnUrl as string;
            if (returnUrl && !returnUrl.startsWith('/auth')) {
                router.push(returnUrl);
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
            {/* LEFT SIDE - Brand Showcase */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 bg-zinc-900 text-white overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl -ml-20 -mb-20" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10" />

                {/* Header Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 flex items-center gap-2"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Stethoscope className="text-white" size={20} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">MediSync</span>
                </motion.div>

                {/* Center Content - Floating UI Demo */}
                <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="relative"
                    >
                        {/* Glass Card 1 - Main */}
                        <div className="w-[380px] backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Status de Saúde</p>
                                    <h3 className="text-2xl font-bold mt-1">Excelente</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                    <Activity className="text-emerald-400" />
                                </div>
                            </div>

                            {/* Simulated Graph */}
                            <div className="h-24 flex items-end justify-between gap-1 mb-6 opacity-80">
                                {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: 0.5 + (i * 0.1), duration: 1 }}
                                        className="w-3 bg-gradient-to-t from-blue-500 to-emerald-400 rounded-t-sm"
                                    />
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-xs text-white/50">Batimentos</p>
                                    <p className="text-lg font-semibold">72 bpm</p>
                                </div>
                                <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-xs text-white/50">Oxigênio</p>
                                    <p className="text-lg font-semibold">98%</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge - Trusted */}
                        <motion.div
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="absolute -right-8 -bottom-6 bg-white text-zinc-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3"
                        >
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                                ))}
                            </div>
                            <div>
                                <p className="text-xs font-bold">10k+ Pacientes</p>
                                <div className="flex text-yellow-400">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} fill="currentColor" />)}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Footer Testimonial */}
                <div className="relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTestimonial}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex gap-1 text-emerald-400 mb-2">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                            </div>
                            <p className="text-xl font-medium leading-relaxed">
                                "{testimonials[activeTestimonial].quote}"
                            </p>
                            <div>
                                <p className="font-semibold">{testimonials[activeTestimonial].author}</p>
                                <p className="text-sm text-white/50">{testimonials[activeTestimonial].role}</p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* RIGHT SIDE - Login Form */}
            <div className="flex items-center justify-center p-8 bg-background relative">
                <div className="absolute top-6 right-6 flex items-center gap-4">
                    <ThemeToggle />
                    <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                        <ArrowLeft size={16} /> Voltar ao site
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[400px] space-y-8"
                >
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Bem-vindo de volta</h1>
                        <p className="text-muted-foreground">
                            Digite suas credenciais para acessar a plataforma.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {error && (
                            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="exemplo@medisync.com"
                                    className="h-11 bg-muted/30"
                                    {...register("email", { required: "Email é obrigatório" })}
                                />
                                {errors.email && <p className="text-sm text-destructive font-medium">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Senha</Label>
                                    <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-11 bg-muted/30"
                                    {...register("password", { required: "Senha é obrigatória" })}
                                />
                                {errors.password && <p className="text-sm text-destructive font-medium">{errors.password.message}</p>}
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Autenticando...
                                </span>
                            ) : (
                                "Entrar na Plataforma"
                            )}
                        </Button>

                        {/* Social Login Mock */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Ou continue com
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="outline" type="button" className="h-10 hover:bg-muted/50">
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </Button>
                            <Button variant="outline" type="button" className="h-10 hover:bg-muted/50">
                                <svg className="mr-2 h-4 w-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <path d="M18.5 16.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                </svg>
                                Apple
                            </Button>
                        </div>
                    </form>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Não tem uma conta?{" "}
                        <Link href="/auth/register" className="underline underline-offset-4 hover:text-primary font-medium">
                            Registre-se agora
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
