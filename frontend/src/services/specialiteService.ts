import { apiClient } from '@/lib/api';
import { Specialite } from '@/types';

export interface CreateSpecialiteData {
  libelle: string;
  description?: string;
}

export const specialiteService = {
  async getSpecialites() {
    return apiClient.get<Specialite[]>('/api/specialites');
  },

  async getSpecialite(id: number) {
    return apiClient.get<Specialite>(`/api/specialites/${id}`);
  },

  async createSpecialite(data: CreateSpecialiteData) {
    return apiClient.post<Specialite>('/api/specialites', data);
  },

  async updateSpecialite(id: number, data: Partial<CreateSpecialiteData>) {
    return apiClient.put<Specialite>(`/api/specialites/${id}`, data);
  },

  async deleteSpecialite(id: number) {
    return apiClient.delete(`/api/specialites/${id}`);
  },
};