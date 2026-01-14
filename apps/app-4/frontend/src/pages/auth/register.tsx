import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Input } from "@/components/ui/shadcn/Input";
import { Button } from "@/components/ui/shadcn/Button";
import { Label } from "@/components/ui/shadcn/Label";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { authAPI } from "@/api/auth";
import Link from "next/link";
import { AlertCircle, CheckCircle, ArrowLeft, Stethoscope, ShieldCheck, UserPlus, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface RegisterForm {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    acceptTerms: boolean;
}

export default function RegisterPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        setError(null);
        try {
            await authAPI.register(data);
            setSuccess(true);
            setTimeout(() => router.push("/auth/login"), 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao registrar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden">
            {/* LEFT SIDE - Feature Showcase */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 bg-zinc-900 text-white overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl -ml-32 -mt-32" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl -mr-20 -mb-20" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10" />

                {/* Header Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 flex items-center gap-2"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Stethoscope className="text-white" size={20} />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">MediSync</span>
                </motion.div>

                {/* Center Content */}
                <div className="relative z-10 flex flex-col justify-center flex-1 max-w-lg">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-bold mb-6 leading-tight"
                    >
                        Comece sua jornada para uma saúde melhor.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-white/70 mb-10 leading-relaxed"
                    >
                        Junte-se a milhares de pacientes e médicos que estão transformando a experiência de cuidados de saúde. É rápido, seguro e totalmente digital.
                    </motion.p>

                    <div className="space-y-6">
                        {[
                            { icon: ShieldCheck, title: "Dados Seguros", desc: "Criptografia de ponta a ponta para sua privacidade." },
                            { icon: UserPlus, title: "Cadastro Simplificado", desc: "Crie sua conta em menos de 2 minutos." },
                            { icon: FileText, title: "Histórico Unificado", desc: "Todos os seus exames e consultas em um só lugar." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className="flex items-start gap-4"
                            >
                                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                    <item.icon className="text-indigo-400" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{item.title}</h3>
                                    <p className="text-sm text-white/50">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-sm text-white/40">
                    © 2024 MediSync Health Inc.
                </div>
            </div>

            {/* RIGHT SIDE - Register Form */}
            <div className="flex items-center justify-center p-8 bg-background relative overflow-y-auto">
                <div className="absolute top-6 right-6 flex items-center gap-4">
                    <ThemeToggle />
                    <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                        <ArrowLeft size={16} /> Voltar ao site
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[450px] space-y-6 pt-10 pb-10"
                >
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Crie sua conta</h1>
                        <p className="text-muted-foreground">
                            Preencha os dados abaixo para começar.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>Conta criada com sucesso! Redirecionando...</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nome Completo</Label>
                                <Input
                                    id="fullName"
                                    placeholder="Ex: João da Silva"
                                    className="h-11 bg-muted/30"
                                    {...register("fullName", { required: "Nome é obrigatório" })}
                                />
                                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        className="h-11 bg-muted/30"
                                        {...register("email", { required: "Email é obrigatório" })}
                                    />
                                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        placeholder="(11) 99999-9999"
                                        className="h-11 bg-muted/30"
                                        {...register("phone", { required: "Telefone é obrigatório" })}
                                    />
                                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="h-11 bg-muted/30"
                                    {...register("password", { required: "Senha é obrigatória", minLength: { value: 6, message: "Mínimo 6 caracteres" } })}
                                />
                                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                                <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                            </div>

                            <div className="pt-2">
                                <div className="flex items-start space-x-2">
                                    <input
                                        type="checkbox"
                                        id="acceptTerms"
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        {...register("acceptTerms", { required: "Você deve aceitar os termos" })}
                                    />
                                    <label htmlFor="acceptTerms" className="text-sm text-muted-foreground leading-snug">
                                        Li e concordo com os{" "}
                                        <Link href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                                            Termos de Serviço
                                        </Link>{" "}
                                        e a{" "}
                                        <Link href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                                            Política de Privacidade
                                        </Link>
                                        .
                                    </label>
                                </div>
                                {errors.acceptTerms && <p className="text-sm text-destructive mt-1">{errors.acceptTerms.message}</p>}
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 mt-4 text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 bg-indigo-600 hover:bg-indigo-700 transition-all" disabled={loading || success}>
                            {loading ? "Criando conta..." : "Criar minha conta"}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Já tem uma conta?{" "}
                        <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary font-medium">
                            Faça login
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
