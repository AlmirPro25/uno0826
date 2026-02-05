
import { api } from '../../lib/axios';
import { CreateBookingRequest, CreateBookingResponse, Booking } from '../../../../shared/types';

export const BookingService = {
  /**
   * Initialize a mission/charter booking.
   */
  createBooking: async (payload: CreateBookingRequest): Promise<CreateBookingResponse> => {
    const { data } = await api.post<CreateBookingResponse>('/bookings', payload);
    return data;
  },

  /**
   * Retrieve command history.
   */
  getMyBookings: async (): Promise<Booking[]> => {
    const { data } = await api.get<Booking[]>('/bookings');
    return data;
  }
};
