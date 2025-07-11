import { apiClient } from './api';
import { Mission, PaginatedResponse } from '../types/api';

export interface CreateMissionData {
  natureIntervention: string;
  objectifDuContrat?: string;
  description?: string;
  dateSortieFicheIntervention?: string;
  clientId: number;
}

class MissionService {
  // Lister les missions
  async getMissions(page = 1, limit = 10): Promise<PaginatedResponse<Mission>> {
    const response = await apiClient.get(`/missions?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Créer une mission
  async createMission(missionData: CreateMissionData): Promise<Mission> {
    const response = await apiClient.post('/missions', missionData);
    return response.data.data;
  }

  // Récupérer une mission par ID
  async getMissionById(id: number): Promise<Mission> {
    const response = await apiClient.get(`/missions/${id}`);
    return response.data.data;
  }

  // Modifier une mission
  async updateMission(id: number, missionData: Partial<CreateMissionData>): Promise<Mission> {
    const response = await apiClient.put(`/missions/${id}`, missionData);
    return response.data.data;
  }

  // Supprimer une mission
  async deleteMission(id: number): Promise<void> {
    await apiClient.delete(`/missions/${id}`);
  }
}

export const missionService = new MissionService();