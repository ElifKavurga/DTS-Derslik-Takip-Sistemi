import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { queryClient } from '@/services/queryClient';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession();
      sessionStorage.clear();
      localStorage.clear();
      queryClient.clear();
    }

    return Promise.reject(error);
  },
);
