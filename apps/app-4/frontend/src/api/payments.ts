import { axiosInstance as api } from './axios';

export interface PaymentConfig {
  enabled: boolean;
  consultPrice: number;
  currency: string;
  priceFormatted: string;
}

export interface Payment {
  id: number;
  appointmentId: number;
  patientId: number;
  amount: number;
  amountFormatted: string;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  description: string;
  paidAt?: string;
  createdAt: string;
}

export interface CreatePaymentData {
  appointmentId: number;
  description?: string;
}

export const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  succeeded: 'Pago',
  failed: 'Falhou',
  refunded: 'Reembolsado',
};

export const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  succeeded: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export const paymentsAPI = {
  // Get payment configuration
  getConfig: async (): Promise<PaymentConfig> => {
    const response = await api.get('/payments/config');
    return response.data;
  },

  // Get all payments for the logged-in patient
  getMyPayments: async (): Promise<Payment[]> => {
    const response = await api.get('/payments/my-payments');
    return response.data || [];
  },

  // Get a specific payment by ID
  getPayment: async (id: number): Promise<Payment> => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // Create a new payment
  createPayment: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await api.post('/payments', data);
    return response.data;
  },

  // Simulate payment (for testing)
  simulatePayment: async (id: number): Promise<{ message: string; status: string }> => {
    const response = await api.post(`/payments/${id}/simulate`);
    return response.data;
  },
};

export default paymentsAPI;
