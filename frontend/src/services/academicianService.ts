import { apiClient } from './axios';
import { AcademicianResponse, UserResponse } from '@/types';

export type CreateManagedAcademicianRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  title: string;
};

export type UpdateManagedAcademicianRequest = Omit<CreateManagedAcademicianRequest, 'password'> & {
  active: boolean;
};

export const academicianService = {
  getAll: async () => {
    const response = await apiClient.get<AcademicianResponse[]>('/academicians');
    return response.data;
  },

  getByDepartment: async (departmentId: string) => {
    const response = await apiClient.get<AcademicianResponse[]>(`/academicians/by-department/${departmentId}`);
    return response.data;
  },

  getManaged: async (params?: { search?: string; title?: string }) => {
    const response = await apiClient.get<UserResponse[]>('/academicians/manage', { params });
    return response.data;
  },

  createManaged: async (payload: CreateManagedAcademicianRequest) => {
    const response = await apiClient.post<UserResponse>('/academicians/manage', payload);
    return response.data;
  },

  updateManaged: async (id: string, payload: UpdateManagedAcademicianRequest) => {
    const response = await apiClient.put<UserResponse>(`/academicians/manage/${id}`, payload);
    return response.data;
  },

  deactivateManaged: async (id: string) => {
    const response = await apiClient.delete<void>(`/academicians/manage/${id}`);
    return response.data;
  },
};
