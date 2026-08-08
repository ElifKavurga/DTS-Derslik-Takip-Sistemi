import { apiClient } from '@/services/axios';

export type NotificationResponse = {
  id: string;
  title: string;
  message: string;
  targetUrl?: string | null;
  read: boolean;
  createdAt: string;
};

export type UnreadNotificationCountResponse = {
  count: number;
};

export const notificationService = {
  getAll: async () => {
    const response = await apiClient.get<NotificationResponse[]>('/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get<UnreadNotificationCountResponse>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put<NotificationResponse>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    await apiClient.put<void>('/notifications/read-all');
  },
};
