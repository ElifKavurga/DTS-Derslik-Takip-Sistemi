import { apiClient } from '@/services/axios';
import { FacultyListResponse, FacultyResponse, CreateFacultyRequest, UpdateFacultyRequest } from '@/types';

export const facultyService = {
  getAll: async () => {
    const response = await apiClient.get<FacultyListResponse>('/faculties');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<FacultyResponse>(`/faculties/${id}`);
    return response.data;
  },
  create: async (payload: CreateFacultyRequest) => {
    const response = await apiClient.post<FacultyResponse>('/faculties', payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateFacultyRequest) => {
    const response = await apiClient.put<FacultyResponse>(`/faculties/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<void>(`/faculties/${id}`);
    return response.data;
  },
};
