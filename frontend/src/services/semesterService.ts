import { apiClient } from './axios';
import { AcademicPeriod, CreateAcademicPeriodRequest, UpdateAcademicPeriodRequest } from '@/types';

export const semesterService = {
  getAll: async (limit?: number) => {
    const response = await apiClient.get<AcademicPeriod[]>('/academic-periods', {
      params: limit ? { limit } : undefined,
    });
    return response.data;
  },

  getActive: async () => {
    const response = await apiClient.get<AcademicPeriod>('/academic-periods/active');
    return response.data;
  },

  create: async (payload: CreateAcademicPeriodRequest) => {
    const response = await apiClient.post<AcademicPeriod>('/academic-periods', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateAcademicPeriodRequest) => {
    const response = await apiClient.put<AcademicPeriod>(`/academic-periods/${id}`, payload);
    return response.data;
  },

  activate: async (id: string) => {
    const response = await apiClient.put<void>(`/academic-periods/${id}/activate`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<void>(`/academic-periods/${id}`);
    return response.data;
  },
};
