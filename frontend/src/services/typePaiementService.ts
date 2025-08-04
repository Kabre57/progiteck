import { apiClient } from '@/lib/api';
import { TypePaiement } from '@/types';

export interface CreateTypePaiementData {
  libelle: string;
  description?: string;
  delaiPaiement?: number;
  tauxRemise?: number;
  actif?: boolean;
}

export const typePaiementService = {
  async getTypesPaiement() {
    return apiClient.get<TypePaiement[]>('/api/types-paiement');
  },

  async getTypePaiement(id: number) {
    return apiClient.get<TypePaiement>(`/api/types-paiement/${id}`);
  },

  async createTypePaiement(data: CreateTypePaiementData) {
    return apiClient.post<TypePaiement>('/api/types-paiement', data);
  },

  async updateTypePaiement(id: number, data: Partial<CreateTypePaiementData>) {
    return apiClient.put<TypePaiement>(`/api/types-paiement/${id}`, data);
  },

  async deleteTypePaiement(id: number) {
    return apiClient.delete(`/api/types-paiement/${id}`);
  },
};