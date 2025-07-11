import { apiClient } from './api';
import { PaginatedResponse } from '../types/api';

export interface Message {
  id: number;
  contenu: string;
  senderId: number;
  receiverId: number;
  lu: boolean;
  dateLecture?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  receiver?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
}

export interface Contact {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: string;
  role?: {
    libelle: string;
  };
}

class MessageService {
  // Récupérer les messages avec un contact
  async getMessages(contactId: number, page = 1, limit = 20): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get(`/messages?contactId=${contactId}&page=${page}&limit=${limit}`);
    return response.data;
  }

  // Récupérer la liste des contacts
  async getContacts(): Promise<Contact[]> {
    const response = await apiClient.get('/messages');
    return response.data.data;
  }

  // Récupérer la liste des contacts disponibles
  async getAvailableContacts(search?: string): Promise<Contact[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/messages/contacts?${params}`);
    return response.data.data;
  }

  // Récupérer le nombre de messages non lus
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get('/messages/unread');
    return response.data.data.unreadCount;
  }

  // Envoyer un message
  async sendMessage(receiverId: number, contenu: string): Promise<Message> {
    const response = await apiClient.post('/messages', { receiverId, contenu });
    return response.data.data;
  }

  // Marquer un message comme lu
  async markAsRead(messageId: number): Promise<void> {
    await apiClient.patch(`/messages/${messageId}/read`);
  }

  // Marquer tous les messages comme lus
  async markAllAsRead(contactId?: number): Promise<void> {
    const params = contactId ? `?contactId=${contactId}` : '';
    await apiClient.patch(`/messages/mark-all-read${params}`);
  }
}

export const messageService = new MessageService();