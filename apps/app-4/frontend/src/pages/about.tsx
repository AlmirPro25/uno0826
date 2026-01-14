import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { Stethoscope, Shield, Clock, Users, Heart, Award, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
    {
        icon: Stethoscope,
        title: 'Telemedicina de Qualidade',
        description: 'Consultas por vídeo com médicos qualificados, do conforto da sua casa.',
    },
    {
        icon: Shield,
        title: 'Segurança e Privacidade',
        description: 'Seus dados são protegidos com criptografia de ponta e conformidade LGPD.',
    },
    {
        icon: Clock,
        title: 'Agendamento Flexível',
        description: 'Agende consultas 24/7, com horários que se adaptam à sua rotina.',
    },
    {
        icon: Users,
        title: 'Equipe Especializada',
        description: 'Médicos de diversas especialidades prontos para atender você.',
    },
];

const stats = [
    { value: '10.000+', label: 'Pacientes atendidos' },
    { value: '500+', label: 'Médicos cadastrados' },
    { value: '98%', label: 'Satisfação' },
    { value: '24/7', label: 'Disponibilidade' },
];

const values = [
    'Compromisso com a saúde e bem-estar dos pacientes',
    'Inovação tecnológica a serviço da medicina',
    'Acessibilidade e inclusão no atendimento médico',
    'Ética e transparência em todas as relações',
    'Excelência no atendimento e qualidade dos serviços',
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Stethoscope className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold">MediSync</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/auth/login">
                            <Button variant="outline">Entrar</Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button>Cadastrar</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Sobre o <span className="text-primary">MediSync</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Somos uma plataforma de telemedicina comprometida em democratizar o acesso 
                            à saúde de qualidade, conectando pacientes e médicos de forma segura e eficiente.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Nossa Missão */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold mb-6">Nossa Missão</h2>
                            <p className="text-lg text-muted-foreground mb-6">
                                Transformar a experiência de cuidado com a saúde através da tecnologia, 
                                tornando o atendimento médico mais acessível, conveniente e humanizado.
                            </p>
                            <p className="text-lg text-muted-foreground">
                                Acreditamos que todos merecem acesso a cuidados médicos de qualidade, 
                                independentemente de onde estejam. Por isso, desenvolvemos uma plataforma 
                                que conecta pacientes a médicos qualificados de forma simples e segura.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {stats.map((stat, index) => (
                                <Card key={index} className="text-center">
                                    <CardContent className="pt-6">
                                        <p className="text-3xl font-bold text-primary">{stat.value}</p>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-12">Por que escolher o MediSync?</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="h-full">
                                    <CardHeader>
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                            <feature.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>{feature.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Nossos Valores */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-12">Nossos Valores</h2>
                        <div className="space-y-4">
                            {values.map((value, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50"
                                >
                                    <CheckCircle className="w-6 h-6 text-primary shrink-0" />
                                    <p className="text-lg">{value}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <Heart className="w-16 h-16 mx-auto mb-6 opacity-80" />
                        <h2 className="text-3xl font-bold mb-4">
                            Pronto para cuidar da sua saúde?
                        </h2>
                        <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                            Junte-se a milhares de pacientes que já confiam no MediSync para seus cuidados médicos.
                        </p>
                        <Link href="/auth/register">
                            <Button size="lg" variant="secondary">
                                Começar agora
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-6 h-6 text-primary" />
                            <span className="font-bold">MediSync</span>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <Link href="/terms" className="hover:text-foreground">Termos</Link>
                            <Link href="/privacy" className="hover:text-foreground">Privacidade</Link>
                            <Link href="/contact" className="hover:text-foreground">Contato</Link>
                            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2024 MediSync. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
