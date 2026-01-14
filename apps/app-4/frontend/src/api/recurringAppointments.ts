import { axiosInstance as api } from './axios';

export interface RecurringAppointment {
  id: number;
  patientId: number;
  doctorId: number;
  startTime: string;
  duration: number;
  frequency: string;
  dayOfWeek: number;
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  patient?: {
    id: number;
    fullName: string;
    email: string;
  };
  doctor?: {
    id: number;
    fullName: string;
    email: string;
    specialty?: string;
  };
}

export interface CreateRecurringRequest {
  doctorId: number;
  startTime: string; // HH:MM format
  duration?: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  maxOccurrences?: number;
  notes?: string;
}

// Get all recurring appointments for the current user
export const getMyRecurringAppointments = async (): Promise<RecurringAppointment[]> => {
  const response = await api.get('/recurring-appointments/my-recurring');
  return response.data;
};

// Get a specific recurring appointment
export const getRecurringAppointment = async (id: number): Promise<RecurringAppointment> => {
  const response = await api.get(`/recurring-appointments/${id}`);
  return response.data;
};

// Create a new recurring appointment
export const createRecurringAppointment = async (data: CreateRecurringRequest): Promise<RecurringAppointment> => {
  const response = await api.post('/recurring-appointments', data);
  return response.data;
};

// Get upcoming occurrences for a recurring appointment
export const getUpcomingOccurrences = async (id: number, count?: number): Promise<{ occurrences: string[] }> => {
  const response = await api.get(`/recurring-appointments/${id}/upcoming`, {
    params: { count }
  });
  return response.data;
};

// Book appointments from a recurring pattern
export const bookFromRecurring = async (id: number, count?: number): Promise<{
  message: string;
  booked: number;
  appointments: any[];
}> => {
  const response = await api.post(`/recurring-appointments/${id}/book`, null, {
    params: { count }
  });
  return response.data;
};

// Cancel a recurring appointment
export const cancelRecurringAppointment = async (id: number): Promise<void> => {
  await api.delete(`/recurring-appointments/${id}`);
};

// Frequency labels in Portuguese
export const frequencyLabels: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
};

// Day of week labels in Portuguese
export const dayOfWeekLabels: string[] = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

// Get label for frequency
export const getFrequencyLabel = (frequency: string): string => {
  return frequencyLabels[frequency] || frequency;
};

// Get label for day of week
export const getDayOfWeekLabel = (dayOfWeek: number): string => {
  return dayOfWeekLabels[dayOfWeek] || '';
};
