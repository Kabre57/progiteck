import { apiClient } from '@/lib/api';
import { Facture } from '@/types';

export interface UpdateFactureData {
  statut?: 'emise' | 'envoyee' | 'payee' | 'annulee';
  datePaiement?: string;
  modePaiement?: string;
  referenceTransaction?: string;
}

export const factureService = {
  async getFactures(params?: {
    page?: number;
    limit?: number;
    statut?: string;
    clientId?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.statut) queryParams.append('statut', params.statut);
    if (params?.clientId) queryParams.append('clientId', params.clientId.toString());

    return apiClient.get<Facture[]>(`/api/factures?${queryParams.toString()}`);
  },

  async getFacture(id: number) {
    return apiClient.get<Facture>(`/api/factures/${id}`);
  },

  async getOverdueFactures() {
    return apiClient.get<Facture[]>('/api/factures/overdue');
  },

  async updateFacture(id: number, data: UpdateFactureData) {
    return apiClient.put<Facture>(`/api/factures/${id}`, data);
  },

  async deleteFacture(id: number) {
    return apiClient.delete(`/api/factures/${id}`);
  },
};