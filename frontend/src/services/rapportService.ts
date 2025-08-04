import { apiClient } from '@/lib/api';
import { Rapport, RapportImage } from '@/types';

export interface CreateRapportData {
  titre: string;
  contenu: string;
  interventionId?: number;
  technicienId: number;
  missionId: number;
  images?: Omit<RapportImage, 'id'>[];
}

export const rapportService = {
  async getRapports(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    technicienId?: number;
    missionId?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.statut) queryParams.append('statut', params.statut);
    if (params?.technicienId) queryParams.append('technicienId', params.technicienId.toString());
    if (params?.missionId) queryParams.append('missionId', params.missionId.toString());

    return apiClient.get<Rapport[]>(`/api/rapports?${queryParams.toString()}`);
  },

  async getRapport(id: number) {
    return apiClient.get<Rapport>(`/api/rapports/${id}`);
  },

  async createRapport(data: CreateRapportData) {
    return apiClient.post<Rapport>('/api/rapports', data);
  },

  async updateRapport(id: number, data: Partial<CreateRapportData>) {
    return apiClient.put<Rapport>(`/api/rapports/${id}`, data);
  },

  async validateRapport(id: number, statut: 'valide' | 'rejete', commentaire?: string) {
    return apiClient.patch<Rapport>(`/api/rapports/${id}/validate`, {
      statut,
      commentaire,
    });
  },

  async deleteRapport(id: number) {
    return apiClient.delete(`/api/rapports/${id}`);
  },
};