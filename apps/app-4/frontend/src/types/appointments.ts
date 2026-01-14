import { User } from "./auth";

export interface Appointment {
    id: number;
    patientId: number;
    doctorId: number;
    startTime: string; // ISO string format
    endTime: string;   // ISO string format
    status: "pending" | "booked" | "completed" | "cancelled" | "no_show";
    patient: User; // populated user data (from schema relations)
    doctor: User;  // populated user data (from schema relations)
}

export interface BookAppointmentPayload {
    doctorId: number;
    startTime: string;
    endTime: string;
}

// Status labels for display
export const AppointmentStatusLabels: Record<Appointment['status'], string> = {
    pending: 'Pendente',
    booked: 'Agendada',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    no_show: 'Não Compareceu'
};

// Status colors for UI
export const AppointmentStatusColors: Record<Appointment['status'], string> = {
    pending: 'bg-amber-100 text-amber-700',
    booked: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-gray-100 text-gray-700'
};
