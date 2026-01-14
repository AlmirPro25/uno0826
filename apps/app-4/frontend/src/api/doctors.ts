import { axiosInstance } from './axios';
import { DoctorRating } from './reviews';

export interface Doctor {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

export interface DoctorWithRating extends Doctor {
  averageRating?: number;
  totalReviews?: number;
}

// Get all doctors
export const getDoctors = async (): Promise<Doctor[]> => {
  const response = await axiosInstance.get('/doctors');
  return response.data;
};

// Get doctor by ID
export const getDoctor = async (id: number): Promise<Doctor> => {
  const response = await axiosInstance.get(`/users/${id}`);
  return response.data;
};

// Get doctor rating
export const getDoctorRating = async (doctorId: number): Promise<DoctorRating> => {
  const response = await axiosInstance.get(`/doctors/${doctorId}/rating`);
  return response.data;
};

// Get doctors with their ratings
export const getDoctorsWithRatings = async (): Promise<DoctorWithRating[]> => {
  const doctors = await getDoctors();
  
  // Fetch ratings for each doctor in parallel
  const doctorsWithRatings = await Promise.all(
    doctors.map(async (doctor) => {
      try {
        const rating = await getDoctorRating(doctor.id);
        return {
          ...doctor,
          averageRating: rating.averageRating,
          totalReviews: rating.totalReviews,
        };
      } catch {
        return {
          ...doctor,
          averageRating: 0,
          totalReviews: 0,
        };
      }
    })
  );
  
  return doctorsWithRatings;
};
