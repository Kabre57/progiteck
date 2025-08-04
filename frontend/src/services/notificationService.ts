import { apiClient } from '@/lib/api';
import { Notification } from '@/types';

export interface NotificationPreferences {
  checkUnusualActivity: boolean;
  checkNewSignIn: boolean;
  notifyLatestNews: boolean;
  notifyFeatureUpdate: boolean;
  notifyAccountTips: boolean;
}

export interface CreateNotificationData {
  userId: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: string;
}

export const notificationService = {
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');

    return apiClient.get<Notification[]>(`/api/notifications?${queryParams.toString()}`);
  },

  async getUnreadCount() {
    return apiClient.get<{ unreadCount: number }>('/api/notifications/unread-count');
  },

  async markAsRead(id: number) {
    return apiClient.patch(`/api/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return apiClient.patch('/api/notifications/mark-all-read');
  },

  async getPreferences() {
    return apiClient.get<NotificationPreferences>('/api/notifications/preferences');
  },

  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    return apiClient.put<NotificationPreferences>('/api/notifications/preferences', preferences);
  },

  async createNotification(data: CreateNotificationData) {
    return apiClient.post<Notification>('/api/notifications', data);
  },

  async deleteNotification(id: number) {
    return apiClient.delete(`/api/notifications/${id}`);
  },
};