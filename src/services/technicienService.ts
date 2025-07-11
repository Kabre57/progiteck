import { apiClient } from './api';
import { Technicien, Specialite, PaginatedResponse, TechnicienDashboard } from '../types/api';

export interface CreateTechnicienData {
  nom: string;
  prenom: string;
  contact?: string;
  specialiteId?: number;
  utilisateurId?: number;
}

class TechnicienService {
  // Lister les techniciens
  async getTechniciens(page = 1, limit = 10): Promise<PaginatedResponse<Technicien>> {
    const response = await apiClient.get(`/techniciens?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Récupérer le dashboard d'un technicien
  async getTechnicienDashboard(technicienId: number): Promise<TechnicienDashboard> {
    const response = await apiClient.get(`/techniciens/dashboard/${technicienId}`);
    return response.data.data;
  }

  // Créer un technicien
  async createTechnicien(technicienData: CreateTechnicienData): Promise<Technicien> {
    const response = await apiClient.post('/techniciens', technicienData);
    return response.data.data;
  }

  // Récupérer un technicien par ID
  async getTechnicienById(id: number): Promise<Technicien> {
    const response = await apiClient.get(`/techniciens/${id}`);
    return response.data.data;
  }

  // Modifier un technicien
  async updateTechnicien(id: number, technicienData: Partial<CreateTechnicienData>): Promise<Technicien> {
    const response = await apiClient.put(`/techniciens/${id}`, technicienData);
    return response.data.data;
  }

  // Supprimer un technicien
  async deleteTechnicien(id: number): Promise<void> {
    await apiClient.delete(`/techniciens/${id}`);
  }

  // Récupérer les spécialités
  async getSpecialites(): Promise<Specialite[]> {
    const response = await apiClient.get('/techniciens/specialites');
    return response.data.data;
  }
}

export const technicienService = new TechnicienService();