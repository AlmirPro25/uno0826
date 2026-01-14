import { axiosInstance } from './axios';

// Types
export interface QueueTicket {
    id: number;
    ticket_number: string;
    clinic_id?: number;
    clinic?: {
        id: number;
        name: string;
    };
    patient_id?: number;
    patient?: {
        id: number;
        full_name: string;
        email: string;
    };
    patient_name?: string;
    triage_report_id?: number;
    triage_report?: {
        id: number;
        priority: string;
        patient_complaint: string;
        recommended_specialty: string;
    };
    priority: string;
    priority_order: number;
    service_type: string;
    specialty?: string;
    status: string;
    counter?: string;
    called_at?: string;
    started_at?: string;
    completed_at?: string;
    called_by?: number;
    called_by_user?: {
        id: number;
        full_name: string;
    };
    notes?: string;
    estimated_wait: number;
    actual_wait: number;
    created_at: string;
    updated_at: string;
}

export interface QueueStats {
    total_waiting: number;
    total_in_service: number;
    total_completed: number;
    avg_wait_time: number;
    by_priority: Record<string, number>;
    by_service: Record<string, number>;
    estimated_wait: Record<string, number>;
}

export interface QueueDisplay {
    current_tickets: QueueTicket[];
    next_tickets: QueueTicket[];
    last_called?: QueueTicket;
    stats: QueueStats;
}

export interface CreateTicketInput {
    clinic_id?: number;
    patient_id?: number;
    patient_name?: string;
    triage_report_id?: number;
    priority: string;
    service_type?: string;
    specialty?: string;
}

// Queue status constants
export const QUEUE_STATUS = {
    WAITING: 'waiting',
    CALLED: 'called',
    IN_SERVICE: 'in_service',
    COMPLETED: 'completed',
    NO_SHOW: 'no_show',
    CANCELLED: 'cancelled'
} as const;

// Priority colors
export const getPriorityColor = (priority: string): string => {
    switch (priority) {
        case 'Emergência':
            return 'bg-red-500 text-white';
        case 'Muito Urgente':
            return 'bg-orange-500 text-white';
        case 'Urgente':
            return 'bg-yellow-500 text-black';
        case 'Pouco Urgente':
            return 'bg-green-500 text-white';
        case 'Não Urgente':
            return 'bg-blue-500 text-white';
        default:
            return 'bg-gray-500 text-white';
    }
};

// Status labels
export const getStatusLabel = (status: string): string => {
    switch (status) {
        case QUEUE_STATUS.WAITING:
            return 'Aguardando';
        case QUEUE_STATUS.CALLED:
            return 'Chamado';
        case QUEUE_STATUS.IN_SERVICE:
            return 'Em Atendimento';
        case QUEUE_STATUS.COMPLETED:
            return 'Concluído';
        case QUEUE_STATUS.NO_SHOW:
            return 'Não Compareceu';
        case QUEUE_STATUS.CANCELLED:
            return 'Cancelado';
        default:
            return status;
    }
};

// API Functions

export const createTicket = async (data: CreateTicketInput): Promise<QueueTicket> => {
    const response = await axiosInstance.post('/queue/tickets', data);
    return response.data;
};

export const getTicket = async (id: number): Promise<QueueTicket> => {
    const response = await axiosInstance.get(`/queue/tickets/${id}`);
    return response.data;
};

export const getTicketByNumber = async (ticketNumber: string): Promise<QueueTicket> => {
    const response = await axiosInstance.get(`/queue/tickets/number/${ticketNumber}`);
    return response.data;
};

export const getWaitingQueue = async (serviceType?: string): Promise<QueueTicket[]> => {
    const params = serviceType ? `?service_type=${encodeURIComponent(serviceType)}` : '';
    const response = await axiosInstance.get(`/queue/waiting${params}`);
    return response.data;
};

export const getCurrentlyServing = async (): Promise<QueueTicket[]> => {
    const response = await axiosInstance.get('/queue/serving');
    return response.data;
};

export const getTodayTickets = async (): Promise<QueueTicket[]> => {
    const response = await axiosInstance.get('/queue/today');
    return response.data;
};

export const callNextTicket = async (counter: string, serviceType?: string): Promise<QueueTicket> => {
    const response = await axiosInstance.post('/queue/call-next', {
        counter,
        service_type: serviceType
    });
    return response.data;
};

export const callSpecificTicket = async (id: number, counter: string): Promise<QueueTicket> => {
    const response = await axiosInstance.post(`/queue/tickets/${id}/call`, { counter });
    return response.data;
};

export const startService = async (id: number): Promise<void> => {
    await axiosInstance.put(`/queue/tickets/${id}/start`);
};

export const completeService = async (id: number): Promise<void> => {
    await axiosInstance.put(`/queue/tickets/${id}/complete`);
};

export const markNoShow = async (id: number): Promise<void> => {
    await axiosInstance.put(`/queue/tickets/${id}/no-show`);
};

export const getQueueStats = async (): Promise<QueueStats> => {
    const response = await axiosInstance.get('/queue/stats');
    return response.data;
};

export const getQueueDisplay = async (): Promise<QueueDisplay> => {
    const response = await axiosInstance.get('/queue/display');
    return response.data;
};

// Create ticket from triage report
export const createTicketFromTriage = async (triageId: number, priority: string, specialty: string): Promise<QueueTicket> => {
    const response = await axiosInstance.post('/queue/tickets', {
        triage_report_id: triageId,
        priority,
        specialty
    });
    return response.data;
};
