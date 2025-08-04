import { apiClient } from '@/lib/api';
import { Message } from '@/types';

export interface CreateMessageData {
  contenu: string;
  receiverId: number;
}

export const messageService = {
  async getMessages(params?: {
    page?: number;
    limit?: number;
    type?: 'sent' | 'received';
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);

    return apiClient.get<Message[]>(`/api/messages?${queryParams.toString()}`);
  },

  async getConversations() {
    return apiClient.get('/api/messages/conversations');
  },

  async getUnreadCount() {
    return apiClient.get<{ unreadCount: number }>('/api/messages/unread-count');
  },

  async sendMessage(data: CreateMessageData) {
    return apiClient.post<Message>('/api/messages', data);
  },

  async markAsRead(id: number) {
    return apiClient.patch(`/api/messages/${id}/read`);
  },

  async deleteMessage(id: number) {
    return apiClient.delete(`/api/messages/${id}`);
  },
};