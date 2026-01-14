import { axiosInstance as api } from './axios';

export interface DayStats {
  date: string;
  count: number;
}

export interface AdminDashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalPatients: number;
  totalDoctors: number;
  totalPrescriptions: number;
  totalCertificates: number;
  appointmentsByStatus: Record<string, number>;
  appointmentsByDay: DayStats[];
}

export interface DoctorStats {
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  totalPrescriptions: number;
  totalCertificates: number;
  totalPatients: number;
  appointmentsByDay: DayStats[];
}

export interface PatientStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalPrescriptions: number;
  totalCertificates: number;
}

export interface DoctorReport {
  doctorId: number;
  doctorName: string;
  specialty: string;
  appointments: number;
  completed: number;
  cancelled: number;
  revenue: number;
  rating: number;
}

export interface ReportByPeriod {
  startDate: string;
  endDate: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  cancellationRate: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  appointmentsByDoctor: DoctorReport[];
  appointmentsByDay: DayStats[];
}

export interface DoctorPeriodReport {
  startDate: string;
  endDate: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  cancellationRate: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  totalPrescriptions: number;
  totalCertificates: number;
  uniquePatients: number;
  appointmentsByDay: DayStats[];
}

export const statsAPI = {
  // Get admin dashboard statistics
  getAdminStats: async (): Promise<AdminDashboardStats> => {
    const response = await api.get('/stats/admin');
    return response.data;
  },

  // Get doctor statistics
  getDoctorStats: async (): Promise<DoctorStats> => {
    const response = await api.get('/stats/doctor');
    return response.data;
  },

  // Get patient statistics
  getPatientStats: async (): Promise<PatientStats> => {
    const response = await api.get('/stats/patient');
    return response.data;
  },

  // Get detailed report by period (Admin only)
  getReportByPeriod: async (startDate: string, endDate: string): Promise<ReportByPeriod> => {
    const response = await api.get('/stats/report', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get doctor report by period
  getDoctorReportByPeriod: async (startDate: string, endDate: string): Promise<DoctorPeriodReport> => {
    const response = await api.get('/stats/doctor-report', {
      params: { startDate, endDate }
    });
    return response.data;
  },
};

export default statsAPI;
