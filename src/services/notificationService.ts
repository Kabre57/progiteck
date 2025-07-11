import { apiClient } from './api';
import { Notification } from '../types/api';

export interface SendNotificationData {
  userId: number;
  type: string;
  message: string;
  data?: any;
}

export interface UpdateNotificationPreferencesData {
  checkUnusualActivity?: boolean;
  checkNewSignIn?: boolean;
  notifyLatestNews?: boolean;
  notifyFeatureUpdate?: boolean;
  notifyAccountTips?: boolean;
}

class NotificationService {
  // Récupérer les notifications de l'utilisateur
  async getNotifications(): Promise<Notification[]> {
    const response = await apiClient.get('/notifications');
    return response.data.data;
  }

  // Marquer une notification comme lue
  async markAsRead(id: number): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/mark-all-read');
  }

  // Supprimer une notification
  async deleteNotification(id: number): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  }

  // Récupérer les préférences de notification
  async getPreferences(): Promise<any> {
    const response = await apiClient.get('/notifications/preferences');
    return response.data.data;
  }

  // Mettre à jour les préférences de notification
  async updatePreferences(preferences: UpdateNotificationPreferencesData): Promise<any> {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data.data;
  }

  // Envoyer une notification (admin seulement)
  async sendNotification(data: SendNotificationData): Promise<Notification> {
    const response = await apiClient.post('/notifications/send', data);
    return response.data.data;
  }
}

export const notificationService = new NotificationService();