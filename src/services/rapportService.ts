import { apiClient } from './api';
import { PaginatedResponse } from '../types/api';

export interface RapportImage {
  id?: number;
  url: string;
  description?: string;
  ordre?: number;
}

export interface Rapport {
  id: number;
  titre: string;
  contenu: string;
  interventionId: number;
  technicienId: number;
  missionId: number;
  createdById: number;
  statut: 'soumis' | 'validé' | 'rejeté';
  dateValidation?: string;
  commentaire?: string;
  createdAt: string;
  updatedAt: string;
  mission?: {
    numIntervention: number;
    natureIntervention: string;
    client?: {
      nom: string;
      entreprise?: string;
    };
  };
  intervention?: {
    id: number;
    dateHeureDebut?: string;
    dateHeureFin?: string;
  };
  technicien?: {
    id: number;
    nom: string;
    prenom: string;
    specialite?: {
      libelle: string;
    };
  };
  createdBy?: {
    id: number;
    nom: string;
    prenom: string;
  };
  images: RapportImage[];
}

export interface CreateRapportData {
  titre: string;
  contenu: string;
  interventionId: number;
  technicienId: number;
  missionId: number;
  images?: RapportImage[];
}

export interface UpdateRapportData {
  titre?: string;
  contenu?: string;
  images?: RapportImage[];
}

export interface ValidateRapportData {
  statut: 'validé' | 'rejeté';
  commentaire?: string;
}

class RapportService {
  // Récupérer tous les rapports
  async getRapports(page = 1, limit = 10, missionId?: number, technicienId?: number, statut?: string): Promise<PaginatedResponse<Rapport>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (missionId) params.append('missionId', missionId.toString());
    if (technicienId) params.append('technicienId', technicienId.toString());
    if (statut) params.append('statut', statut);
    
    const response = await apiClient.get(`/rapports?${params}`);
    return response.data;
  }

  // Récupérer les rapports d'un technicien
  async getTechnicienRapports(technicienId: number, page = 1, limit = 10): Promise<PaginatedResponse<Rapport>> {
    const response = await apiClient.get(`/rapports/technicien/${technicienId}?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Récupérer les rapports d'une mission
  async getMissionRapports(missionId: number, page = 1, limit = 10): Promise<PaginatedResponse<Rapport>> {
    const response = await apiClient.get(`/rapports/mission/${missionId}?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Créer un rapport
  async createRapport(rapportData: CreateRapportData): Promise<Rapport> {
    const response = await apiClient.post('/rapports', rapportData);
    return response.data.data;
  }

  // Récupérer un rapport par ID
  async getRapportById(id: number): Promise<Rapport> {
    const response = await apiClient.get(`/rapports/${id}`);
    return response.data.data;
  }

  // Modifier un rapport
  async updateRapport(id: number, rapportData: UpdateRapportData): Promise<Rapport> {
    const response = await apiClient.put(`/rapports/${id}`, rapportData);
    return response.data.data;
  }

  // Valider ou rejeter un rapport
  async validateRapport(id: number, validationData: ValidateRapportData): Promise<Rapport> {
    const response = await apiClient.patch(`/rapports/${id}/validate`, validationData);
    return response.data.data;
  }

  // Supprimer un rapport
  async deleteRapport(id: number): Promise<void> {
    await apiClient.delete(`/rapports/${id}`);
  }
}

export const rapportService = new RapportService();