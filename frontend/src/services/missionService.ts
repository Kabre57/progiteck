import { apiClient } from '@/lib/api';
import { Mission } from '@/types';

export interface CreateMissionData {
  natureIntervention: string;
  objectifDuContrat: string;
  description?: string;
  priorite?: string;
  statut?: string;
  dateSortieFicheIntervention: string;
  clientId: number;
}

export const missionService = {
  async getMissions(params?: {
    page?: number;
    limit?: number;
    clientId?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.clientId) queryParams.append('clientId', params.clientId.toString());

    return apiClient.get<Mission[]>(`/api/missions?${queryParams.toString()}`);
  },

  async getMission(id: string) {
    return apiClient.get<Mission>(`/api/missions/${encodeURIComponent(id)}`);
  },

  async createMission(data: CreateMissionData) {
    try {
      // Préparer les données selon la structure exacte attendue par le backend
      const missionData = {
        natureIntervention: data.natureIntervention,
        objectifDuContrat: data.objectifDuContrat,
        dateSortieFicheIntervention: data.dateSortieFicheIntervention,
        clientId: data.clientId,
        // Champs optionnels seulement s'ils sont fournis
        ...(data.description && { description: data.description }),
        ...(data.priorite && { priorite: data.priorite }),
        ...(data.statut && { statut: data.statut })
      };
      
      console.log('Sending mission data:', missionData);
      return apiClient.post<Mission>('/api/missions', missionData);
    } catch (error) {
      console.error('Mission validation error:', error);
      throw error;
    }
  },
};