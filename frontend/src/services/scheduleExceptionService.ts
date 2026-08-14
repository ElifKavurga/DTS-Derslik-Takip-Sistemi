import { apiClient } from './axios';
import {
  CreateExtraLessonRequest,
  CreateScheduleCancellationRequest,
  CreateScheduleMakeupRequest,
  ScheduleExceptionResponse,
} from '@/types/scheduleException';

export const scheduleExceptionService = {
  getMine: async (params?: { weekStart?: string; weekEnd?: string }) => {
    const response = await apiClient.get<ScheduleExceptionResponse[]>('/academician/schedule-exceptions', { params });
    return response.data;
  },

  cancelLesson: async (payload: CreateScheduleCancellationRequest) => {
    const response = await apiClient.post<ScheduleExceptionResponse>('/academician/schedule-exceptions/cancel', payload);
    return response.data;
  },

  createMakeup: async (payload: CreateScheduleMakeupRequest) => {
    const response = await apiClient.post<ScheduleExceptionResponse>('/academician/schedule-exceptions/makeup', payload);
    return response.data;
  },

  createExtraLesson: async (payload: CreateExtraLessonRequest) => {
    const response = await apiClient.post<ScheduleExceptionResponse>('/academician/schedule-exceptions/extra', payload);
    return response.data;
  },
};
