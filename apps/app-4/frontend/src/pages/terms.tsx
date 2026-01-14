import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Termos de Serviço</CardTitle>
                    <p className="text-muted-foreground">Última atualização: Dezembro de 2024</p>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                    <h2>1. Aceitação dos Termos</h2>
                    <p>
                        Ao acessar e usar a plataforma MediSync, você concorda em cumprir e estar vinculado 
                        a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, 
                        não poderá acessar o serviço.
                    </p>

                    <h2>2. Descrição do Serviço</h2>
                    <p>
                        O MediSync é uma plataforma de telemedicina que permite:
                    </p>
                    <ul>
                        <li>Agendamento de consultas médicas online</li>
                        <li>Realização de videochamadas com profissionais de saúde</li>
                        <li>Acesso a prontuários médicos digitais</li>
                        <li>Emissão de receitas e atestados digitais</li>
                        <li>Comunicação segura entre pacientes e médicos</li>
                    </ul>

                    <h2>3. Cadastro e Conta</h2>
                    <p>
                        Para utilizar nossos serviços, você deve criar uma conta fornecendo informações 
                        verdadeiras, precisas e completas. Você é responsável por manter a confidencialidade 
                        de sua senha e por todas as atividades realizadas em sua conta.
                    </p>

                    <h2>4. Uso Adequado</h2>
                    <p>Você concorda em não:</p>
                    <ul>
                        <li>Usar o serviço para fins ilegais ou não autorizados</li>
                        <li>Transmitir vírus ou código malicioso</li>
                        <li>Tentar acessar contas de outros usuários</li>
                        <li>Interferir no funcionamento adequado da plataforma</li>
                    </ul>

                    <h2>5. Serviços Médicos</h2>
                    <p>
                        O MediSync é uma plataforma de intermediação. Os serviços médicos são prestados 
                        por profissionais independentes devidamente registrados em seus conselhos de classe. 
                        A plataforma não se responsabiliza por diagnósticos ou tratamentos prescritos.
                    </p>

                    <h2>6. Pagamentos</h2>
                    <p>
                        Os valores das consultas são definidos pelos profissionais de saúde. O pagamento 
                        deve ser realizado antes da consulta. Cancelamentos com menos de 24 horas de 
                        antecedência podem estar sujeitos a cobrança.
                    </p>

                    <h2>7. Limitação de Responsabilidade</h2>
                    <p>
                        O MediSync não será responsável por danos indiretos, incidentais ou consequenciais 
                        decorrentes do uso ou impossibilidade de uso do serviço.
                    </p>

                    <h2>8. Modificações</h2>
                    <p>
                        Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
                        entrarão em vigor após a publicação na plataforma.
                    </p>

                    <h2>9. Contato</h2>
                    <p>
                        Para dúvidas sobre estes termos, entre em contato através do email: 
                        suporte@medisync.com.br
                    </p>

                    <div className="mt-8 pt-4 border-t">
                        <Link href="/privacy" className="text-primary hover:underline">
                            Ver Política de Privacidade →
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
