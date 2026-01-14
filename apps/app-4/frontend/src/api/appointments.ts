import { axiosInstance } from "./axios";
import { Appointment, BookAppointmentPayload } from "@/types/appointments";

export const appointmentsAPI = {
    getAvailableSlots: async (doctorId: number, date: string) => {
        const response = await axiosInstance.get("/appointments/available-slots", {
            params: { doctorId, date },
        });
        return response.data;
    },

    getMyAppointments: async () => {
        const response = await axiosInstance.get<Appointment[]>("/appointments/my-appointments");
        return response.data;
    },

    bookAppointment: async (payload: BookAppointmentPayload): Promise<Appointment> => {
        const response = await axiosInstance.post<Appointment>("/appointments/book", payload);
        return response.data;
    },

    cancelAppointment: async (appointmentId: number) => {
        const response = await axiosInstance.put(`/appointments/${appointmentId}/cancel`);
        return response.data;
    },

    getVideoCallInfo: async (appointmentId: number) => {
        const response = await axiosInstance.get<{ roomName: string; provider: string }>(`/appointments/${appointmentId}/video-call`);
        return response.data;
    },

    getAppointment: async (appointmentId: number) => {
        const response = await axiosInstance.get<Appointment>(`/appointments/${appointmentId}`);
        return response.data;
    },

    startCall: async (appointmentId: number) => {
        const response = await axiosInstance.post<{ message: string; roomName: string }>(`/appointments/${appointmentId}/start-call`);
        return response.data;
    },

    completeAppointment: async (appointmentId: number) => {
        const response = await axiosInstance.put(`/appointments/${appointmentId}/complete`);
        return response.data;
    },
};
