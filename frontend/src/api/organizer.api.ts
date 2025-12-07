import api from './axios';
import type {
    ApiResponse,
    EventType,
    EventFormData,
    TicketTypeFormData,
    TicketType,
    OrganizerDashboardStats,
    BookingType
} from '../types';

export const organizerApi = {
    // Get organizer dashboard
    getDashboard: async (): Promise<ApiResponse<OrganizerDashboardStats>> => {
        const response = await api.get('/organizer/dashboard');
        return response.data;
    },

    // Create event
    createEvent: async (data: EventFormData): Promise<ApiResponse<{ event: EventType }>> => {
        const response = await api.post('/organizer/events', data);
        return response.data;
    },

    // Get my events
    getMyEvents: async (): Promise<ApiResponse<{ events: EventType[] }>> => {
        const response = await api.get('/organizer/events');
        return response.data;
    },

    // Get single event
    getEvent: async (id: string): Promise<ApiResponse<{ event: EventType }>> => {
        const response = await api.get(`/organizer/events/${id}`);
        return response.data;
    },

    // Update event
    updateEvent: async (id: string, data: Partial<EventFormData>): Promise<ApiResponse<{ event: EventType }>> => {
        const response = await api.put(`/organizer/events/${id}`, data);
        return response.data;
    },

    // Delete event
    deleteEvent: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.delete(`/organizer/events/${id}`);
        return response.data;
    },

    // Create ticket type
    createTicketType: async (
        eventId: string,
        data: TicketTypeFormData
    ): Promise<ApiResponse<{ ticketType: TicketType }>> => {
        const response = await api.post(`/organizer/events/${eventId}/ticket-types`, data);
        return response.data;
    },

    // Get event attendees
    getEventAttendees: async (eventId: string): Promise<ApiResponse<{ bookings: BookingType[] }>> => {
        const response = await api.get(`/organizer/events/${eventId}/attendees`);
        return response.data;
    },
};
