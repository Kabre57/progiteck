import { apiClient } from './api';
import { Facture, PaginatedResponse } from '../types/api';

export interface CreateFactureFromDevisData {
  devisId: number;
  dateEcheance: string;
}

export interface UpdateFactureData {
  statut?: 'emise' | 'envoyee' | 'payee' | 'annulee';
  dateEcheance?: string;
  datePaiement?: string;
  modePaiement?: string;
  referenceTransaction?: string;
}

export interface PayFactureData {
  modePaiement: string;
  referenceTransaction?: string;
  datePaiement?: string;
}

class FactureService {
  // Lister les factures
  async getFactures(page = 1, limit = 10, statut?: string): Promise<PaginatedResponse<Facture>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (statut) {
      params.append('statut', statut);
    }

    const response = await apiClient.get(`/factures?${params}`);
    return response.data;
  }

  // Créer une facture à partir d'un devis
  async createFactureFromDevis(data: CreateFactureFromDevisData): Promise<Facture> {
    const response = await apiClient.post('/factures/from-devis', data);
    return response.data.data;
  }

  // Récupérer une facture par ID
  async getFactureById(id: number): Promise<Facture> {
    const response = await apiClient.get(`/factures/${id}`);
    return response.data.data;
  }

  // Modifier une facture
  async updateFacture(id: number, factureData: UpdateFactureData): Promise<Facture> {
    const response = await apiClient.put(`/factures/${id}`, factureData);
    return response.data.data;
  }

  // Envoyer une facture
  async sendFacture(id: number): Promise<Facture> {
    const response = await apiClient.post(`/factures/${id}/send`);
    return response.data.data;
  }

  // Marquer une facture comme payée
  async payFacture(id: number, paymentData: PayFactureData): Promise<Facture> {
    const response = await apiClient.post(`/factures/${id}/pay`, paymentData);
    return response.data.data;
  }
}

export const factureService = new FactureService();