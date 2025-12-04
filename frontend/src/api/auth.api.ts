import api from './axios';
import type {
    ApiResponse,
    AuthResponse,
    LoginCredentials,
    RegisterData,
    User
} from '@/types';

export const authApi = {
    // Register new user
    register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    // Login user
    login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    // Get current user
    getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // Update profile
    updateProfile: async (data: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },

    // Logout
    logout: async (): Promise<ApiResponse<null>> => {
        const response = await api.post('/auth/logout');
        return response.data;
    },
};
