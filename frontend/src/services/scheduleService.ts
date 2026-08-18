import { apiClient } from './axios';
import {
  AvailableClassroomResponse,
  CreateWeeklyScheduleRequest,
  ScheduleCompletionResponse,
  ScheduleTimeConfigurationRequest,
  ScheduleTimeConfigurationResponse,
  Semester,
  UpdateWeeklyScheduleRequest,
  WeeklyScheduleResponse,
} from '@/types';

export const scheduleService = {
  getAll: async (periodId?: string) => {
    const response = await apiClient.get<WeeklyScheduleResponse[]>('/schedules', {
      params: periodId ? { periodId } : undefined,
    });
    return response.data;
  },

  getStatus: async (periodId?: string) => {
    const response = await apiClient.get<ScheduleCompletionResponse>('/schedules/status', {
      params: periodId ? { periodId } : undefined,
    });
    return response.data;
  },

  getTimeConfiguration: async () => {
    const response = await apiClient.get<ScheduleTimeConfigurationResponse>('/schedules/time-configuration');
    return response.data;
  },

  updateTimeConfiguration: async (payload: ScheduleTimeConfigurationRequest) => {
    const response = await apiClient.put<ScheduleTimeConfigurationResponse>('/schedules/time-configuration', payload);
    return response.data;
  },

  getAvailableClassrooms: async (params: { courseId?: string; dayOfWeek: string; timeSlot: string; slotCount: number; excludeScheduleId?: string }) => {
    const response = await apiClient.get<AvailableClassroomResponse[]>('/schedules/available-classrooms', { params });
    return response.data;
  },

  create: async (payload: CreateWeeklyScheduleRequest) => {
    const response = await apiClient.post<WeeklyScheduleResponse[]>('/schedules', payload);
    return response.data;
  },

  update: async (id: string, payload: UpdateWeeklyScheduleRequest) => {
    const response = await apiClient.put<WeeklyScheduleResponse[]>(`/schedules/${id}`, payload);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/schedules/${id}`);
  },
};
