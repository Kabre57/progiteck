import { apiClient } from '@/lib/api';
import { Devis, DevisLigne } from '@/types';

export interface CreateDevisData {
  clientId: number;
  missionId?: number;
  titre: string;
  description?: string;
  tauxTVA: number;
  dateValidite: string;
  lignes: Omit<DevisLigne, 'id' | 'montantHT'>[];
}

export const devisService = {
  async getDevis(params?: {
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

    return apiClient.get<Devis[]>(`/api/devis?${queryParams.toString()}`);
  },

  async getDevisById(id: number) {
    return apiClient.get<Devis>(`/api/devis/${id}`);
  },

  async createDevis(data: CreateDevisData) {
    return apiClient.post<Devis>('/api/devis', data);
  },

  async updateDevis(id: number, data: Partial<CreateDevisData>) {
    return apiClient.put<Devis>(`/api/devis/${id}`, data);
  },

  async validateDevis(id: number, statut: string, commentaire?: string) {
    return apiClient.patch<Devis>(`/api/devis/${id}/validate`, {
      statut,
      ...(statut.includes('dg') && { commentaireDG: commentaire }),
      ...(statut.includes('pdg') && { commentairePDG: commentaire }),
    });
  },

  async convertToInvoice(id: number) {
    return apiClient.post(`/api/devis/${id}/convert-to-invoice`);
  },

  async deleteDevis(id: number) {
    return apiClient.delete(`/api/devis/${id}`);
  },
};