import { apiClient } from '@/services/axios';
import {
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/types';

export const authService = {
  login: async (payload: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },
  forgotPassword: async (payload: ForgotPasswordRequest) => {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/forgot-password', payload);
    return response.data;
  },
  resetPassword: async (payload: ResetPasswordRequest) => {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', payload);
    return response.data;
  },
  me: async () => {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },
};
