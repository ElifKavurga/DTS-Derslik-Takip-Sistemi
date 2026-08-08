import { apiClient } from './axios';
import { AcademicianResponse } from '@/types';

export const academicianService = {
  getAll: async () => {
    const response = await apiClient.get<AcademicianResponse[]>('/academicians');
    return response.data;
  },

  getByDepartment: async (departmentId: string) => {
    const response = await apiClient.get<AcademicianResponse[]>(`/academicians/by-department/${departmentId}`);
    return response.data;
  }
};
