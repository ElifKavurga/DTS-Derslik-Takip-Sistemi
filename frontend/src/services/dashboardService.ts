import { apiClient } from '@/services/axios';
import { DashboardStatsResponse, DepartmentAdminDashboardResponse } from '@/types';

export const dashboardService = {
  getStats: async () => {
    const response = await apiClient.get<DashboardStatsResponse>('/dashboard/stats');
    return response.data;
  },
  getDepartmentAdminDashboard: async () => {
    const response = await apiClient.get<DepartmentAdminDashboardResponse>('/dashboard/department-admin');
    return response.data;
  },
};
