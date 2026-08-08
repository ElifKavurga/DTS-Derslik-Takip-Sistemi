import { apiClient } from './axios';

export type DepartmentResponse = {
  id: string;
  name: string;
  code: string;
  facultyId: string;
};

export const departmentService = {
  getByFaculty: async (facultyId: string) => {
    const response = await apiClient.get<DepartmentResponse[]>(`/departments/by-faculty/${facultyId}`);
    return response.data;
  },
  getAll: async () => {
    const response = await apiClient.get<DepartmentResponse[]>('/departments');
    return response.data;
  }
};
