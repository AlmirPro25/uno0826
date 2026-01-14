import { QueueTicket, getPriorityColor } from '@/api/queue';
import { QRCode } from './QRCode';

interface TicketPrintProps {
    ticket: QueueTicket;
    clinicName?: string;
}

export function TicketPrint({ ticket, clinicName = 'MediSync' }: TicketPrintProps) {
    const trackUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/queue/track?ticket=${ticket.ticket_number}`
        : '';

    const priorityColors: Record<string, string> = {
        'Emergência': '#ef4444',
        'Muito Urgente': '#f97316',
        'Urgente': '#eab308',
        'Pouco Urgente': '#22c55e',
        'Não Urgente': '#3b82f6',
    };

    const priorityColor = priorityColors[ticket.priority] || '#6b7280';

    return (
        <div className="print-ticket bg-white p-6 max-w-[300px] mx-auto font-mono text-black">
            <style jsx>{`
                @media print {
                    .print-ticket {
                        width: 80mm;
                        padding: 10mm;
                        margin: 0;
                        font-size: 12px;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                <h1 className="text-xl font-bold">{clinicName}</h1>
                <p className="text-sm text-gray-600">Sistema de Atendimento</p>
            </div>

            {/* Ticket Number */}
            <div className="text-center py-6">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Sua Senha</p>
                <p 
                    className="text-5xl font-black tracking-wider my-2"
                    style={{ color: priorityColor }}
                >
                    {ticket.ticket_number}
                </p>
                <div 
                    className="inline-block px-4 py-1 rounded-full text-white text-sm font-bold"
                    style={{ backgroundColor: priorityColor }}
                >
                    {ticket.priority}
                </div>
            </div>

            {/* Details */}
            <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Paciente:</span>
                    <span className="font-medium">{ticket.patient_name || 'N/A'}</span>
                </div>
                {ticket.service_type && (
                    <div className="flex justify-between">
                        <span className="text-gray-500">Serviço:</span>
                        <span className="font-medium">{ticket.service_type}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-gray-500">Data:</span>
                    <span className="font-medium">
                        {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Hora:</span>
                    <span className="font-medium">
                        {new Date(ticket.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                </div>
            </div>

            {/* QR Code */}
            <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4 text-center">
                <p className="text-xs text-gray-500 mb-2">Escaneie para acompanhar sua posição</p>
                <div className="flex justify-center">
                    <QRCode value={trackUrl} size={100} />
                </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4 text-center text-xs text-gray-500">
                <p>Aguarde ser chamado no painel</p>
                <p className="mt-1">Obrigado pela preferência!</p>
            </div>
        </div>
    );
}

export default TicketPrint;
