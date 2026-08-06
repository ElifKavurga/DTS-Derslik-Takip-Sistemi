import { apiClient } from '@/services/axios';
import { DashboardStatsResponse } from '@/types';

export const dashboardService = {
  getStats: async () => {
    const response = await apiClient.get<DashboardStatsResponse>('/dashboard/stats');
    return response.data;
  },
};
