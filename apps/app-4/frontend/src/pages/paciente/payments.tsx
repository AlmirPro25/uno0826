import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Button } from "@/components/ui/shadcn/Button";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { paymentsAPI, Payment, PaymentConfig, paymentStatusLabels, paymentStatusColors } from "@/api/payments";
import { AlertCircle, Loader, CreditCard, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PacientePaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [config, setConfig] = useState<PaymentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [simulating, setSimulating] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [paymentsData, configData] = await Promise.all([
                paymentsAPI.getMyPayments(),
                paymentsAPI.getConfig()
            ]);
            setPayments(paymentsData);
            setConfig(configData);
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    const handleSimulatePayment = async (paymentId: number) => {
        setSimulating(paymentId);
        try {
            await paymentsAPI.simulatePayment(paymentId);
            // Refresh payments
            const updatedPayments = await paymentsAPI.getMyPayments();
            setPayments(updatedPayments);
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao processar pagamento");
        } finally {
            setSimulating(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'succeeded':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'pending':
            case 'processing':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'failed':
            case 'refunded':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <CreditCard className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Meus Pagamentos</h1>
                <p className="text-muted-foreground mt-2">Histórico de pagamentos de consultas</p>
            </div>

            {config && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Valor da Consulta</p>
                                <p className="text-2xl font-bold text-primary">{config.priceFormatted}</p>
                            </div>
                            <CreditCard className="w-10 h-10 text-primary/50" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert className="border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
            )}

            {payments.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Seus pagamentos aparecerão aqui após agendar uma consulta
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {payments.map((payment, index) => (
                        <motion.div
                            key={payment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(payment.status)}
                                            <div>
                                                <CardTitle className="text-lg">
                                                    Consulta #{payment.appointmentId}
                                                </CardTitle>
                                                <CardDescription>
                                                    {format(new Date(payment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColors[payment.status]}`}>
                                            {paymentStatusLabels[payment.status]}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-2xl font-bold">{payment.amountFormatted}</p>
                                            {payment.paidAt && (
                                                <p className="text-sm text-muted-foreground">
                                                    Pago em {format(new Date(payment.paidAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </p>
                                            )}
                                        </div>
                                        {payment.status === 'pending' && (
                                            <Button
                                                onClick={() => handleSimulatePayment(payment.id)}
                                                disabled={simulating === payment.id}
                                            >
                                                {simulating === payment.id ? (
                                                    <Loader className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <CreditCard className="w-4 h-4 mr-2" />
                                                )}
                                                Pagar Agora
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
