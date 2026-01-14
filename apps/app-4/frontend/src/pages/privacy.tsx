import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Política de Privacidade</CardTitle>
                    <p className="text-muted-foreground">Última atualização: Dezembro de 2024</p>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                    <h2>1. Introdução</h2>
                    <p>
                        A MediSync está comprometida em proteger sua privacidade. Esta política descreve 
                        como coletamos, usamos e protegemos suas informações pessoais em conformidade 
                        com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
                    </p>

                    <h2>2. Dados Coletados</h2>
                    <p>Coletamos os seguintes tipos de dados:</p>
                    
                    <h3>2.1 Dados de Identificação</h3>
                    <ul>
                        <li>Nome completo</li>
                        <li>CPF</li>
                        <li>Data de nascimento</li>
                        <li>Email</li>
                        <li>Telefone</li>
                    </ul>

                    <h3>2.2 Dados de Saúde (Dados Sensíveis)</h3>
                    <ul>
                        <li>Histórico médico</li>
                        <li>Diagnósticos</li>
                        <li>Prescrições médicas</li>
                        <li>Atestados</li>
                        <li>Resultados de exames</li>
                    </ul>

                    <h3>2.3 Dados de Uso</h3>
                    <ul>
                        <li>Logs de acesso</li>
                        <li>Endereço IP</li>
                        <li>Dispositivo utilizado</li>
                        <li>Histórico de navegação na plataforma</li>
                    </ul>

                    <h2>3. Finalidade do Tratamento</h2>
                    <p>Seus dados são utilizados para:</p>
                    <ul>
                        <li>Prestação dos serviços de telemedicina</li>
                        <li>Agendamento e gerenciamento de consultas</li>
                        <li>Comunicação entre pacientes e profissionais de saúde</li>
                        <li>Emissão de documentos médicos</li>
                        <li>Cumprimento de obrigações legais</li>
                        <li>Melhoria dos serviços</li>
                    </ul>

                    <h2>4. Base Legal</h2>
                    <p>O tratamento de dados é realizado com base em:</p>
                    <ul>
                        <li>Consentimento do titular</li>
                        <li>Execução de contrato</li>
                        <li>Cumprimento de obrigação legal</li>
                        <li>Tutela da saúde (para dados sensíveis)</li>
                    </ul>

                    <h2>5. Compartilhamento de Dados</h2>
                    <p>Seus dados podem ser compartilhados com:</p>
                    <ul>
                        <li>Profissionais de saúde que prestam atendimento</li>
                        <li>Processadores de pagamento</li>
                        <li>Autoridades públicas quando exigido por lei</li>
                    </ul>
                    <p>
                        <strong>Não vendemos ou compartilhamos seus dados com terceiros para fins de marketing.</strong>
                    </p>

                    <h2>6. Segurança dos Dados</h2>
                    <p>Implementamos medidas de segurança incluindo:</p>
                    <ul>
                        <li>Criptografia de dados em trânsito e em repouso</li>
                        <li>Controle de acesso baseado em funções</li>
                        <li>Logs de auditoria</li>
                        <li>Backups regulares</li>
                        <li>Monitoramento de segurança</li>
                    </ul>


                    <h2>7. Seus Direitos (LGPD)</h2>
                    <p>Você tem direito a:</p>
                    <ul>
                        <li><strong>Confirmação:</strong> Saber se tratamos seus dados</li>
                        <li><strong>Acesso:</strong> Obter cópia dos seus dados</li>
                        <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                        <li><strong>Anonimização:</strong> Solicitar anonimização de dados desnecessários</li>
                        <li><strong>Portabilidade:</strong> Transferir seus dados para outro serviço</li>
                        <li><strong>Eliminação:</strong> Solicitar exclusão dos dados (quando aplicável)</li>
                        <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
                    </ul>

                    <h2>8. Retenção de Dados</h2>
                    <p>
                        Dados de saúde são mantidos pelo período mínimo exigido pela legislação brasileira 
                        (20 anos para prontuários médicos). Outros dados são mantidos enquanto necessário 
                        para a prestação dos serviços ou cumprimento de obrigações legais.
                    </p>

                    <h2>9. Cookies</h2>
                    <p>
                        Utilizamos cookies essenciais para o funcionamento da plataforma e cookies de 
                        análise para melhorar nossos serviços. Você pode gerenciar suas preferências 
                        de cookies nas configurações do navegador.
                    </p>

                    <h2>10. Encarregado de Dados (DPO)</h2>
                    <p>
                        Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados, 
                        entre em contato com nosso Encarregado de Proteção de Dados:
                    </p>
                    <p>
                        Email: dpo@medisync.com.br<br />
                        Telefone: (11) 1234-5678
                    </p>

                    <h2>11. Alterações nesta Política</h2>
                    <p>
                        Esta política pode ser atualizada periodicamente. Notificaremos sobre alterações 
                        significativas através do email cadastrado ou aviso na plataforma.
                    </p>

                    <div className="mt-8 pt-4 border-t">
                        <Link href="/terms" className="text-primary hover:underline">
                            Ver Termos de Serviço →
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
