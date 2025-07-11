import { apiClient } from './api';
import { Devis, PaginatedResponse } from '../types/api';

export interface CreateDevisData {
  clientId: number;
  missionId?: number;
  titre: string;
  description?: string;
  dateValidite: string;
  tauxTVA?: number;
  lignes: Array<{
    designation: string;
    quantite: number;
    prixUnitaire: number;
  }>;
}

export interface UpdateDevisData {
  titre?: string;
  description?: string;
  dateValidite?: string;
  tauxTVA?: number;
  lignes?: Array<{
    id?: number;
    designation: string;
    quantite: number;
    prixUnitaire: number;
  }>;
}

class DevisService {
  // Lister les devis
  async getDevis(page = 1, limit = 10, statut?: string): Promise<PaginatedResponse<Devis>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (statut) {
      params.append('statut', statut);
    }

    const response = await apiClient.get(`/devis?${params}`);
    return response.data;
  }

  // Créer un devis
  async createDevis(devisData: CreateDevisData): Promise<Devis> {
    const response = await apiClient.post('/devis', devisData);
    return response.data.data;
  }

  // Récupérer un devis par ID
  async getDevisById(id: number): Promise<Devis> {
    const response = await apiClient.get(`/devis/${id}`);
    return response.data.data;
  }

  // Modifier un devis
  async updateDevis(id: number, devisData: UpdateDevisData): Promise<Devis> {
    const response = await apiClient.put(`/devis/${id}`, devisData);
    return response.data.data;
  }

  // Envoyer un devis pour validation DG
  async sendDevis(id: number): Promise<Devis> {
    const response = await apiClient.post(`/devis/${id}/send`);
    return response.data.data;
  }

  // Valider ou refuser un devis (DG)
  async validateDevis(id: number, statut: 'valide_dg' | 'refuse_dg', commentaireDG?: string): Promise<Devis> {
    const response = await apiClient.post(`/devis/${id}/validate`, {
      statut,
      commentaireDG,
    });
    return response.data.data;
  }

  // Réponse client au devis
  async responseDevis(id: number, statut: 'accepte_client' | 'refuse_client', commentaireClient?: string): Promise<Devis> {
    const response = await apiClient.post(`/devis/${id}/response`, {
      statut,
      commentaireClient,
    });
    return response.data.data;
  }

  // Créer une facture à partir d'un devis
  async createFactureFromDevis(devisId: number, dateEcheance: string): Promise<any> {
    const response = await apiClient.post('/factures/from-devis', {
      devisId,
      dateEcheance
    });
    return response.data.data;
  }

  // Supprimer un devis
  async deleteDevis(id: number): Promise<void> {
    await apiClient.delete(`/devis/${id}`);
  }
}

export const devisService = new DevisService();