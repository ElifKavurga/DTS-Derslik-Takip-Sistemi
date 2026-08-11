import { apiClient } from './axios';
import {
  AvailableClassroomResponse,
  CreateWeeklyScheduleRequest,
  Semester,
  UpdateWeeklyScheduleRequest,
  WeeklyScheduleResponse,
} from '@/types';

export const scheduleService = {
  getAll: async (semester?: Semester) => {
    const response = await apiClient.get<WeeklyScheduleResponse[]>('/schedules', {
      params: semester ? { semester } : undefined,
    });
    return response.data;
  },

  getAvailableClassrooms: async (params: { dayOfWeek: string; timeSlot: string; excludeScheduleId?: string }) => {
    const response = await apiClient.get<AvailableClassroomResponse[]>('/schedules/available-classrooms', { params });
    return response.data;
  },

  create: async (payload: CreateWeeklyScheduleRequest) => {
    const response = await apiClient.post<WeeklyScheduleResponse>('/schedules', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateWeeklyScheduleRequest) => {
    const response = await apiClient.put<WeeklyScheduleResponse>(`/schedules/${id}`, payload);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/schedules/${id}`);
  },
};
