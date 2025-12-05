import api from './axios';
import type {
    ApiResponse,
    Event,
    EventFilters,
    Category,
    Review,
    PaginatedResponse
} from '../types';

export const eventsApi = {
    // Get all events with filters
    getEvents: async (filters?: EventFilters): Promise<ApiResponse<{
        events: Event[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }
        const response = await api.get(`/events?${params.toString()}`);
        return response.data;
    },

    // Get event by ID
    getEventById: async (id: string): Promise<ApiResponse<{ event: Event }>> => {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    // Get all categories
    getCategories: async (): Promise<ApiResponse<{ categories: Category[] }>> => {
        const response = await api.get('/events/categories');
        return response.data;
    },

    // Report event
    reportEvent: async (id: string, reason: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post(`/events/${id}/report`, { reason });
        return response.data;
    },

    // Get event reviews
    getEventReviews: async (
        eventId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<ApiResponse<{
        reviews: Review[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        averageRating: number;
    }>> => {
        const response = await api.get(`/events/${eventId}/reviews?page=${page}&limit=${limit}`);
        return response.data;
    },
};
