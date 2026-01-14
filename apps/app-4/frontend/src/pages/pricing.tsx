import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Button } from "@/components/ui/shadcn/Button";
import { Check, Stethoscope } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const plans = [
    {
        name: "Básico",
        price: "R$ 99",
        period: "/consulta",
        description: "Ideal para consultas pontuais",
        features: [
            "Consulta por videochamada",
            "Receita digital",
            "Atestado médico",
            "Chat com médico",
            "Prontuário digital",
        ],
        highlighted: false,
    },
    {
        name: "Mensal",
        price: "R$ 199",
        period: "/mês",
        description: "Para quem precisa de acompanhamento",
        features: [
            "3 consultas por mês",
            "Receitas ilimitadas",
            "Atestados ilimitados",
            "Chat prioritário",
            "Prontuário completo",
            "Agendamento prioritário",
            "Suporte 24/7",
        ],
        highlighted: true,
    },
    {
        name: "Família",
        price: "R$ 399",
        period: "/mês",
        description: "Cuide de toda a família",
        features: [
            "Até 5 dependentes",
            "10 consultas por mês",
            "Todas as especialidades",
            "Receitas ilimitadas",
            "Atestados ilimitados",
            "Prontuário familiar",
            "Suporte VIP",
        ],
        highlighted: false,
    },
];


export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Header */}
            <header className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <Stethoscope className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold">MediSync</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/auth/login">
                            <Button variant="ghost">Entrar</Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button>Criar Conta</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="pt-32 pb-20 px-4">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Planos e Preços
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Escolha o plano ideal para suas necessidades de saúde
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className={`h-full relative ${plan.highlighted ? "border-primary shadow-lg scale-105" : ""}`}>
                                    {plan.highlighted && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                                            Mais Popular
                                        </div>
                                    )}
                                    <CardHeader className="text-center pb-2">
                                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                        <CardDescription>{plan.description}</CardDescription>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold">{plan.price}</span>
                                            <span className="text-muted-foreground">{plan.period}</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-3 mb-6">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                    <span className="text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Link href="/auth/register">
                                            <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                                                Começar Agora
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>


                    {/* FAQ Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-20 text-center"
                    >
                        <h2 className="text-2xl font-bold mb-4">Dúvidas sobre os planos?</h2>
                        <p className="text-muted-foreground mb-6">
                            Confira nossa página de perguntas frequentes ou entre em contato.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/faq">
                                <Button variant="outline">Ver FAQ</Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline">Fale Conosco</Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-8 px-4 border-t">
                <div className="container mx-auto text-center text-sm text-muted-foreground">
                    <p>© 2024 MediSync. Todos os direitos reservados.</p>
                    <div className="flex gap-4 justify-center mt-2">
                        <Link href="/terms" className="hover:text-primary">Termos</Link>
                        <Link href="/privacy" className="hover:text-primary">Privacidade</Link>
                        <Link href="/contact" className="hover:text-primary">Contato</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
