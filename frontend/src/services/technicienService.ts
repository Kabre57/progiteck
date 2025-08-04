import { apiClient } from '@/lib/api';
import { Technicien } from '@/types';

export interface CreateTechnicienData {
  nom: string;
  prenom: string;
  contact: string;
  specialiteId: number;
  utilisateurId?: number;
}

export const technicienService = {
  async getTechniciens(params?: {
    page?: number;
    limit?: number;
    specialiteId?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.specialiteId) queryParams.append('specialiteId', params.specialiteId.toString());

    return apiClient.get<Technicien[]>(`/api/techniciens?${queryParams.toString()}`);
  },

  async getTechnicien(id: number) {
    return apiClient.get<Technicien>(`/api/techniciens/${id}`);
  },

  async createTechnicien(data: CreateTechnicienData) {
    return apiClient.post<Technicien>('/api/techniciens', data);
  },

  async updateTechnicien(id: number, data: Partial<CreateTechnicienData>) {
    return apiClient.put<Technicien>(`/api/techniciens/${id}`, data);
  },

  async deleteTechnicien(id: number) {
    return apiClient.delete(`/api/techniciens/${id}`);
  },
};