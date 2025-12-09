import api from './axios';
import type {
    ApiResponse,
    User,
    AdminDashboardStats,
    ReportedEvent
} from '../types';

export const adminApi = {
    // Get admin dashboard
    getDashboard: async (): Promise<ApiResponse<AdminDashboardStats>> => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    // Get pending organizers
    getPendingOrganizers: async (): Promise<ApiResponse<{ organizers: User[] }>> => {
        const response = await api.get('/admin/pending-organizers');
        return response.data;
    },

    // Approve organizer
    approveOrganizer: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post(`/admin/organizers/${id}/approve`);
        return response.data;
    },

    // Reject organizer
    rejectOrganizer: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post(`/admin/organizers/${id}/reject`);
        return response.data;
    },

    // Get all users
    getAllUsers: async (
        page: number = 1,
        limit: number = 20
    ): Promise<ApiResponse<{
        users: User[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>> => {
        const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
        return response.data;
    },

    // Update user status
    updateUserStatus: async (
        id: string,
        status: 'active' | 'blocked' | 'pending'
    ): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.patch(`/admin/users/${id}/status`, { status });
        return response.data;
    },

    // Get reported events
    getReportedEvents: async (): Promise<ApiResponse<{ reports: ReportedEvent[] }>> => {
        const response = await api.get('/admin/reported-events');
        return response.data;
    },

    // Resolve a report
    resolveReport: async (
        id: string,
        adminNotes?: string
    ): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.post(`/admin/reported-events/${id}/resolve`, { adminNotes });
        return response.data;
    },

    // Delete event (admin only)
    deleteEvent: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        const response = await api.delete(`/admin/events/${id}`);
        return response.data;
    },
};
