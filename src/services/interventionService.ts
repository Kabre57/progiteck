import { apiClient } from './api';
import { Intervention, PaginatedResponse } from '../types/api';

export interface CreateInterventionData {
  dateHeureDebut?: string;
  dateHeureFin?: string;
  duree?: number;
  missionId: number;
  technicienId?: number;
  techniciens?: Array<{
    id: number;
    role?: string;
    commentaire?: string;
  }>;
}

export interface AddTechnicienData {
  technicienId: number;
  role?: string;
  commentaire?: string;
}

class InterventionService {
  // Lister les interventions
  async getInterventions(page = 1, limit = 10, technicienId?: number): Promise<PaginatedResponse<Intervention>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (technicienId) {
      params.append('technicienId', technicienId.toString());
    }

    const response = await apiClient.get(`/interventions?${params}`);
    return response.data;
  }

  // Récupérer les interventions d'un technicien
  async getTechnicienInterventions(technicienId: number, page = 1, limit = 10): Promise<PaginatedResponse<Intervention>> {
    const response = await apiClient.get(`/interventions/technicien/${technicienId}?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Créer une intervention
  async createIntervention(interventionData: CreateInterventionData): Promise<Intervention> {
    const response = await apiClient.post('/interventions', interventionData);
    return response.data.data;
  }

  // Récupérer une intervention par ID
  async getInterventionById(id: number): Promise<Intervention> {
    const response = await apiClient.get(`/interventions/${id}`);
    return response.data.data;
  }

  // Modifier une intervention
  async updateIntervention(id: number, interventionData: Partial<CreateInterventionData>): Promise<Intervention> {
    const response = await apiClient.put(`/interventions/${id}`, interventionData);
    return response.data.data;
  }

  // Ajouter un technicien à une intervention
  async addTechnicien(interventionId: number, technicienData: AddTechnicienData): Promise<any> {
    const response = await apiClient.post(`/interventions/${interventionId}/techniciens`, technicienData);
    return response.data.data;
  }

  // Retirer un technicien d'une intervention
  async removeTechnicien(interventionId: number, technicienId: number): Promise<void> {
    await apiClient.delete(`/interventions/${interventionId}/techniciens/${technicienId}`);
  }

  // Supprimer une intervention
  async deleteIntervention(id: number): Promise<void> {
    await apiClient.delete(`/interventions/${id}`);
  }
}

export const interventionService = new InterventionService();