import { apiClient } from './api';
import { Specialite, PaginatedResponse } from '../types/api';

export interface CreateSpecialiteData {
  libelle: string;
  description?: string;
}

class SpecialiteService {
  // Lister les spécialités
  async getSpecialites(page = 1, limit = 10): Promise<PaginatedResponse<Specialite>> {
    try {
      const response = await apiClient.get(`/specialites?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des spécialités:', error);
      throw error;
    }
  }

  // Créer une spécialité
  async createSpecialite(specialiteData: CreateSpecialiteData): Promise<Specialite> {
    const response = await apiClient.post('/specialites', specialiteData);
    return response.data.data;
  }

  // Récupérer une spécialité par ID
  async getSpecialiteById(id: number): Promise<Specialite> {
    const response = await apiClient.get(`/specialites/${id}`);
    return response.data.data;
  }

  // Modifier une spécialité
  async updateSpecialite(id: number, specialiteData: Partial<CreateSpecialiteData>): Promise<Specialite> {
    const response = await apiClient.put(`/specialites/${id}`, specialiteData);
    return response.data.data;
  }

  // Supprimer une spécialité
  async deleteSpecialite(id: number): Promise<void> {
    await apiClient.delete(`/specialites/${id}`);
  }
}

export const specialiteService = new SpecialiteService();