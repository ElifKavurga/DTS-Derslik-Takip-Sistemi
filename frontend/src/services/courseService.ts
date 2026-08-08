import { apiClient } from './axios';
import { CourseListResponse, CourseResponse, CreateCourseRequest, UpdateCourseRequest } from '@/types';

export const courseService = {
  getAll: async () => {
    const response = await apiClient.get<CourseListResponse>('/courses');
    return response.data.courses;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<CourseResponse>(`/courses/${id}`);
    return response.data;
  },

  create: async (payload: CreateCourseRequest) => {
    const response = await apiClient.post<CourseResponse>('/courses', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateCourseRequest) => {
    const response = await apiClient.put<CourseResponse>(`/courses/${id}`, payload);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<void>(`/courses/${id}`);
    return response.data;
  },
};
