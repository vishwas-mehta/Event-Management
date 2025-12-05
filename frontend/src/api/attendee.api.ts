import api from './axios';
import type {
    ApiResponse,
    Booking,
    BookingFormData,
    ReviewFormData,
    Review
} from '../types';

export const attendeeApi = {
    // Book ticket
    bookTicket: async (data: BookingFormData): Promise<ApiResponse<{ booking: Booking }>> => {
        const response = await api.post('/attendee/bookings', data);
        return response.data;
    },

    // Get my bookings
    getMyBookings: async (): Promise<ApiResponse<{ bookings: Booking[] }>> => {
        const response = await api.get('/attendee/bookings');
        return response.data;
    },

    // Cancel booking
    cancelBooking: async (id: string): Promise<ApiResponse<{ message: string; waitlistNotified?: number }>> => {
        const response = await api.delete(`/attendee/bookings/${id}`);
        return response.data;
    },

    // Mark attendance
    markAttendance: async (bookingId: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post(`/attendee/bookings/${bookingId}/attend`);
        return response.data;
    },

    // Create review
    createReview: async (eventId: string, data: ReviewFormData): Promise<ApiResponse<{ review: Review }>> => {
        const response = await api.post(`/attendee/events/${eventId}/reviews`, data);
        return response.data;
    },

    // Join waitlist
    joinWaitlist: async (
        eventId: string,
        ticketTypeId?: string
    ): Promise<ApiResponse<{ message: string; position: number }>> => {
        const response = await api.post(`/attendee/events/${eventId}/waitlist`, { ticketTypeId });
        return response.data;
    },
};
