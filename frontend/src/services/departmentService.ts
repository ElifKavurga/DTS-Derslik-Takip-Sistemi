import { apiClient } from './axios';

export type DepartmentResponse = {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  facultyName: string;
  academicianCount: number;
  courseCount: number;
};

export type CreateDepartmentRequest = {
  name: string;
  code: string;
  facultyId: string;
};

export type UpdateDepartmentRequest = CreateDepartmentRequest;

export const departmentService = {
  getByFaculty: async (facultyId: string) => {
    const response = await apiClient.get<DepartmentResponse[]>(`/departments/by-faculty/${facultyId}`);
    return response.data;
  },
  getAll: async () => {
    const response = await apiClient.get<DepartmentResponse[]>('/departments');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get<DepartmentResponse>(`/departments/${id}`);
    return response.data;
  },
  create: async (payload: CreateDepartmentRequest) => {
    const response = await apiClient.post<DepartmentResponse>('/departments', payload);
    return response.data;
  },
  update: async (id: string, payload: UpdateDepartmentRequest) => {
    const response = await apiClient.put<DepartmentResponse>(`/departments/${id}`, payload);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<void>(`/departments/${id}`);
    return response.data;
  }
};
