import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Input } from "@/components/ui/shadcn/Input";
import { Button } from "@/components/ui/shadcn/Button";
import { Label } from "@/components/ui/shadcn/Label";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { Mail, Phone, MapPin, Send, CheckCircle, MessageCircle } from "lucide-react";

interface ContactForm {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export default function ContactPage() {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactForm>();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const onSubmit = async (data: ContactForm) => {
        setLoading(true);
        // Simular envio
        await new Promise(resolve => setTimeout(resolve, 1500));
        setSuccess(true);
        reset();
        setLoading(false);
        setTimeout(() => setSuccess(false), 5000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
                    <MessageCircle className="w-8 h-8 text-primary" />
                    Fale Conosco
                </h1>
                <p className="text-muted-foreground mt-2">
                    Estamos aqui para ajudar. Entre em contato conosco.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Info Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="h-full">
                        <CardContent className="pt-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Email</h3>
                            <p className="text-sm text-muted-foreground">suporte@medisync.com.br</p>
                            <p className="text-sm text-muted-foreground">contato@medisync.com.br</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="h-full">
                        <CardContent className="pt-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Phone className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Telefone</h3>
                            <p className="text-sm text-muted-foreground">(11) 1234-5678</p>
                            <p className="text-sm text-muted-foreground">Seg-Sex: 8h às 18h</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full">
                        <CardContent className="pt-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-2">Endereço</h3>
                            <p className="text-sm text-muted-foreground">Av. Paulista, 1000</p>
                            <p className="text-sm text-muted-foreground">São Paulo - SP</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>


            {/* Contact Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Envie uma mensagem</CardTitle>
                        <CardDescription>
                            Preencha o formulário abaixo e responderemos em até 24 horas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success && (
                            <Alert className="mb-6 border-green-500 bg-green-500/10">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertDescription className="text-green-600 dark:text-green-400">
                                    Mensagem enviada com sucesso! Responderemos em breve.
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input
                                        id="name"
                                        placeholder="Seu nome"
                                        {...register("name", { required: "Nome é obrigatório" })}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        {...register("email", { required: "Email é obrigatório" })}
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Assunto</Label>
                                <Input
                                    id="subject"
                                    placeholder="Assunto da mensagem"
                                    {...register("subject", { required: "Assunto é obrigatório" })}
                                />
                                {errors.subject && (
                                    <p className="text-sm text-destructive">{errors.subject.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Mensagem</Label>
                                <textarea
                                    id="message"
                                    className="w-full min-h-[150px] p-3 border rounded-md bg-background resize-none"
                                    placeholder="Digite sua mensagem..."
                                    {...register("message", { required: "Mensagem é obrigatória" })}
                                />
                                {errors.message && (
                                    <p className="text-sm text-destructive">{errors.message.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    "Enviando..."
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Enviar Mensagem
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
