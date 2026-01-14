import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const faqItems: FAQItem[] = [
    // Geral
    {
        category: "Geral",
        question: "O que é o MediSync?",
        answer: "O MediSync é uma plataforma de telemedicina que permite agendar consultas médicas online, realizar videochamadas com profissionais de saúde, acessar prontuários digitais e receber receitas e atestados de forma segura."
    },
    {
        category: "Geral",
        question: "O MediSync é seguro?",
        answer: "Sim! Utilizamos criptografia de ponta a ponta para proteger seus dados. Seguimos todas as normas da LGPD (Lei Geral de Proteção de Dados) e as melhores práticas de segurança da informação em saúde."
    },
    // Agendamento
    {
        category: "Agendamento",
        question: "Como agendar uma consulta?",
        answer: "Acesse a seção 'Agendamentos', escolha o médico desejado, selecione uma data e horário disponível, e confirme o agendamento. Você receberá um email de confirmação."
    },
    {
        category: "Agendamento",
        question: "Posso cancelar uma consulta?",
        answer: "Sim, você pode cancelar uma consulta a qualquer momento através da seção 'Meus Agendamentos'. Recomendamos cancelar com pelo menos 24 horas de antecedência."
    },
    {
        category: "Agendamento",
        question: "Como funciona a consulta recorrente?",
        answer: "Você pode criar padrões de consultas recorrentes (semanal, quinzenal ou mensal) para facilitar o acompanhamento médico contínuo. Acesse 'Consultas Recorrentes' para configurar."
    },
    // Videochamada
    {
        category: "Videochamada",
        question: "Como funciona a videochamada?",
        answer: "No horário da consulta, acesse 'Meus Agendamentos' e clique em 'Entrar na Chamada'. Você será conectado a uma sala de vídeo segura com seu médico. Certifique-se de ter câmera e microfone funcionando."
    },
    {
        category: "Videochamada",
        question: "Preciso instalar algum programa?",
        answer: "Não! A videochamada funciona diretamente no navegador. Recomendamos usar Chrome, Firefox ou Edge atualizados para melhor experiência."
    },

    // Documentos
    {
        category: "Documentos",
        question: "Como acesso minhas receitas?",
        answer: "Todas as receitas emitidas pelos médicos ficam disponíveis na seção 'Minhas Receitas'. Você pode visualizar, baixar em PDF ou compartilhar com farmácias."
    },
    {
        category: "Documentos",
        question: "Como obtenho um atestado médico?",
        answer: "Após a consulta, o médico pode emitir um atestado digital que ficará disponível na seção 'Meus Atestados'. O documento tem validade legal e pode ser baixado em PDF."
    },
    {
        category: "Documentos",
        question: "Posso acessar meu histórico médico?",
        answer: "Sim! Na seção 'Histórico Médico' você encontra todos os seus prontuários, diagnósticos e anotações de consultas anteriores. Você também pode exportar todo o histórico em PDF."
    },
    // Pagamento
    {
        category: "Pagamento",
        question: "Quais formas de pagamento são aceitas?",
        answer: "Aceitamos cartões de crédito, débito e PIX. O pagamento é processado de forma segura antes da consulta."
    },
    {
        category: "Pagamento",
        question: "Posso pedir reembolso?",
        answer: "Cancelamentos com mais de 24 horas de antecedência têm reembolso integral. Para cancelamentos com menos tempo, entre em contato com nosso suporte."
    },
    // Conta
    {
        category: "Conta",
        question: "Como altero meus dados cadastrais?",
        answer: "Acesse 'Meu Perfil' no menu lateral. Lá você pode atualizar nome, telefone, email e outras informações pessoais."
    },
    {
        category: "Conta",
        question: "Esqueci minha senha, o que faço?",
        answer: "Na tela de login, clique em 'Esqueceu sua senha?'. Você receberá um email com instruções para criar uma nova senha."
    },
    {
        category: "Conta",
        question: "Como excluo minha conta?",
        answer: "Acesse 'Meu Perfil' e role até a seção 'Zona de Perigo'. Lá você encontra a opção de excluir sua conta. Atenção: esta ação é irreversível."
    },
];

const categories = [...new Set(faqItems.map(item => item.category))];

export default function FAQPage() {
    const [openItems, setOpenItems] = useState<number[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const toggleItem = (index: number) => {
        setOpenItems(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const filteredItems = selectedCategory
        ? faqItems.filter(item => item.category === selectedCategory)
        : faqItems;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
                    <HelpCircle className="w-8 h-8 text-primary" />
                    Perguntas Frequentes
                </h1>
                <p className="text-muted-foreground mt-2">
                    Encontre respostas para as dúvidas mais comuns
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        selectedCategory === null
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                    }`}
                >
                    Todas
                </button>
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm transition-colors ${
                            selectedCategory === category
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* FAQ Items */}
            <Card>
                <CardContent className="pt-6 space-y-2">
                    {filteredItems.map((item, index) => {
                        const globalIndex = faqItems.indexOf(item);
                        const isOpen = openItems.includes(globalIndex);

                        return (
                            <div key={globalIndex} className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleItem(globalIndex)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                                >
                                    <span className="font-medium pr-4">{item.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                                            isOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="px-4 pb-4 text-muted-foreground">
                                                {item.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Contact Section */}
            <Card>
                <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">
                        Não encontrou o que procurava?
                    </p>
                    <p className="mt-2">
                        Entre em contato: <a href="mailto:suporte@medisync.com.br" className="text-primary hover:underline">suporte@medisync.com.br</a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
