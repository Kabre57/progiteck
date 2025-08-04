import { apiClient } from '@/lib/api';
import { Materiel, SortieMateriel, EntreeMateriel, CreateMaterielData, CreateSortieData, CreateEntreeData } from '@/types';

export const stockService = {
  // Gestion des matériels
  async getMateriels(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categorie?: string;
    seuilAlerte?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.categorie) queryParams.append('categorie', params.categorie);
    if (params?.seuilAlerte) queryParams.append('seuilAlerte', 'true');

    return apiClient.get<Materiel[]>(`/api/stock/materiels?${queryParams.toString()}`);
  },

  async getMaterielById(id: number) {
    return apiClient.get<Materiel>(`/api/stock/materiels/${id}`);
  },

  async createMateriel(data: CreateMaterielData) {
    return apiClient.post<Materiel>('/api/stock/materiels', data);
  },

  async updateMateriel(id: number, data: Partial<CreateMaterielData>) {
    return apiClient.put<Materiel>(`/api/stock/materiels/${id}`, data);
  },

  async deleteMateriel(id: number) {
    return apiClient.delete(`/api/stock/materiels/${id}`);
  },

  // Gestion des sorties
  async getSorties(params?: {
    page?: number;
    limit?: number;
    interventionId?: number;
    technicienId?: number;
    materielId?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.interventionId) queryParams.append('interventionId', params.interventionId.toString());
    if (params?.technicienId) queryParams.append('technicienId', params.technicienId.toString());
    if (params?.materielId) queryParams.append('materielId', params.materielId.toString());

    return apiClient.get<SortieMateriel[]>(`/api/stock/sorties?${queryParams.toString()}`);
  },

  async createSortie(data: CreateSortieData) {
    return apiClient.post<SortieMateriel>('/api/stock/sorties', data);
  },

  async retournerMateriel(sortieId: number, quantiteRetour: number, commentaire?: string) {
    return apiClient.patch(`/api/stock/sorties/${sortieId}/retour`, {
      quantiteRetour,
      commentaire,
      dateRetour: new Date().toISOString()
    });
  },

  // Gestion des entrées
  async getEntrees(params?: {
    page?: number;
    limit?: number;
    materielId?: number;
    source?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.materielId) queryParams.append('materielId', params.materielId.toString());
    if (params?.source) queryParams.append('source', params.source);

    return apiClient.get<EntreeMateriel[]>(`/api/stock/entrees?${queryParams.toString()}`);
  },

  async createEntree(data: CreateEntreeData) {
    return apiClient.post<EntreeMateriel>('/api/stock/entrees', data);
  },

  // Vérifications et alertes
  async checkDisponibilite(materielId: number, quantiteRequise: number) {
    return apiClient.post<{ disponible: boolean; quantiteDisponible: number }>('/api/stock/check-disponibilite', {
      materielId,
      quantiteRequise
    });
  },

  async getAlertes() {
    return apiClient.get<Materiel[]>('/api/stock/alertes');
  },

  // Statistiques
  async getStatsStock() {
    return apiClient.get('/api/stock/stats');
  },

  // Historique par intervention
  async getMaterielsByIntervention(interventionId: number) {
    return apiClient.get<SortieMateriel[]>(`/api/stock/interventions/${interventionId}/materiels`);
  }
};