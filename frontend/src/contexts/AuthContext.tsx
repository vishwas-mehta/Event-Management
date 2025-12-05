import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import type {
    User,
    AuthContextType,
    LoginCredentials,
    RegisterData
} from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch user data if token exists
    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const response = await authApi.getCurrentUser();
                    setUser(response.data.user);
                } catch (error) {
                    console.error('Failed to load user:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        loadUser();
    }, [token]);

    const login = async (credentials: LoginCredentials) => {
        const response = await authApi.login(credentials);
        const { user: userData, token: userToken } = response.data;

        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
    };

    const register = async (data: RegisterData) => {
        const response = await authApi.register(data);
        const { user: userData, token: userToken } = response.data;

        // For organizers with pending status, don't auto-login
        if (userData.status === 'pending') {
            return;
        }

        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
    };

    const logout = () => {
        authApi.logout().catch(() => { }); // Call API but don't wait
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
