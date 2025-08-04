import { apiClient } from '@/lib/api';
import { Intervention } from '@/types';

export interface CreateInterventionData {
  dateHeureDebut: string;
  dateHeureFin?: string;
  duree?: number;
  missionId: number;
  techniciens: Array<{
    technicienId: number;
    role: string;
    commentaire?: string;
  }>;
}

export interface AvailabilityCheck {
  technicienId: number;
  dateHeureDebut: string;
  dateHeureFin: string;
  excludeInterventionId?: number;
}

export interface AvailabilityResponse {
  technicienId: number;
  technicien: string;
  specialite: string;
  available: boolean;
  period: {
    debut: string;
    fin: string;
  };
  conflictingInterventions?: Array<{
    id: number;
    mission: string;
    dateDebut: string;
    dateFin: string;
  }>;
}

export const interventionService = {
  async getInterventions(params?: {
    page?: number;
    limit?: number;
    missionId?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.missionId) queryParams.append('missionId', params.missionId.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiClient.get<Intervention[]>(`/api/interventions?${queryParams.toString()}`);
  },

  async getIntervention(id: number) {
    return apiClient.get<Intervention>(`/api/interventions/${id}`);
  },

  // Vérifier disponibilité technicien
  async checkAvailability(data: AvailabilityCheck) {
    return apiClient.post<AvailabilityResponse>('/api/interventions/check-availability', data);
  },

  // Créer intervention avec vérification automatique
  async createIntervention(data: CreateInterventionData) {
    return apiClient.post<Intervention>('/api/interventions', data);
  },

  // Créer intervention avec vérification de disponibilité préalable
  async createInterventionSafe(data: CreateInterventionData) {
    // Vérifier d'abord la disponibilité de tous les techniciens
    if (data.dateHeureDebut && data.dateHeureFin && data.techniciens) {
      for (const tech of data.techniciens) {
        const availability = await this.checkAvailability({
          technicienId: tech.technicienId,
          dateHeureDebut: data.dateHeureDebut,
          dateHeureFin: data.dateHeureFin
        });
        
        if (!availability.data.available) {
          throw new Error(`Technicien ${availability.data.technicien} non disponible`);
        }
      }
    }
    
    return this.createIntervention(data);
  },

  // Vérifier disponibilité de plusieurs techniciens
  async checkMultipleAvailability(
    technicienIds: number[], 
    dateDebut: string, 
    dateFin: string
  ) {
    const checks = await Promise.all(
      technicienIds.map(id => 
        this.checkAvailability({
          technicienId: id,
          dateHeureDebut: dateDebut,
          dateHeureFin: dateFin
        })
      )
    );

    return checks.map((check, index) => ({
      technicienId: technicienIds[index],
      available: check.data.available,
      technicien: check.data.technicien,
      specialite: check.data.specialite
    }));
  },

  async updateIntervention(id: number, data: Partial<CreateInterventionData>) {
    return apiClient.put<Intervention>(`/api/interventions/${id}`, data);
  },

  async deleteIntervention(id: number) {
    return apiClient.delete(`/api/interventions/${id}`);
  },
};