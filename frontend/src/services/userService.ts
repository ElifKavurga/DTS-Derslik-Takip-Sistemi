import { apiClient } from '@/services/axios';

export const userService = {
  getAll: async () => {
    const response = await apiClient.get<any>('/users');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<any>(`/users/${id}`);
    return response.data;
  },
  create: async (payload: any) => {
    const response = await apiClient.post<any>('/users', payload);
    return response.data;
  },
  update: async (id: string, payload: any) => {
    const response = await apiClient.put<any>(`/users/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<void>(`/users/${id}`);
    return response.data;
  },
};
