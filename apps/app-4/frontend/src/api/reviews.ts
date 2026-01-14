import { axiosInstance } from './axios';

export interface Review {
  id: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DoctorRating {
  doctorId: number;
  averageRating: number;
  totalReviews: number;
}

export interface CreateReviewData {
  appointmentId: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewData {
  rating: number;
  comment?: string;
}

// Get my reviews (patient)
export const getMyReviews = async (): Promise<Review[]> => {
  const response = await axiosInstance.get('/reviews/my-reviews');
  return response.data;
};

// Get a specific review
export const getReview = async (id: number): Promise<Review> => {
  const response = await axiosInstance.get(`/reviews/${id}`);
  return response.data;
};

// Get review for an appointment
export const getAppointmentReview = async (appointmentId: number): Promise<Review> => {
  const response = await axiosInstance.get(`/appointments/${appointmentId}/review`);
  return response.data;
};

// Create a new review
export const createReview = async (data: CreateReviewData): Promise<Review> => {
  const response = await axiosInstance.post('/reviews', data);
  return response.data;
};

// Update a review
export const updateReview = async (id: number, data: UpdateReviewData): Promise<Review> => {
  const response = await axiosInstance.put(`/reviews/${id}`, data);
  return response.data;
};

// Delete a review
export const deleteReview = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/reviews/${id}`);
};

// Get all reviews for a doctor
export const getDoctorReviews = async (doctorId: number): Promise<Review[]> => {
  const response = await axiosInstance.get(`/doctors/${doctorId}/reviews`);
  return response.data;
};

// Get doctor's average rating
export const getDoctorRating = async (doctorId: number): Promise<DoctorRating> => {
  const response = await axiosInstance.get(`/doctors/${doctorId}/rating`);
  return response.data;
};
