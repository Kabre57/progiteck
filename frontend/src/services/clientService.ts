import { apiClient } from '@/lib/api';
import { Client, ApiResponse } from '@/types';

export interface CreateClientData {
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  typeDeCart?: 'Standard' | 'Premium' | 'VIP';
  typePaiementId?: number;
  localisation?: string;
}

export const clientService = {
  async getClients(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiClient.get<Client[]>(`/api/clients?${queryParams.toString()}`);
  },

  async getClient(id: number) {
    return apiClient.get<Client>(`/api/clients/${id}`);
  },

  async createClient(data: CreateClientData) {
    return apiClient.post<Client>('/api/clients', data);
  },

  async updateClient(id: number, data: Partial<CreateClientData>) {
    return apiClient.put<Client>(`/api/clients/${id}`, data);
  },

  async deleteClient(id: number) {
    return apiClient.delete(`/api/clients/${id}`);
  },
};