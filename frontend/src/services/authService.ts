import { apiClient } from '@/services/axios';
import { AuthResponse, AuthUser, LoginRequest } from '@/types';

export const authService = {
  login: async (payload: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },
  me: async () => {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },
};
