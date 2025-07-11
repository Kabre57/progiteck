import { apiClient } from './api';
import { Client, PaginatedResponse } from '../types/api';

export interface CreateClientData {
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  typeDeCart?: string;
  statut?: 'active' | 'inactive';
  localisation?: string;
}

class ClientService {
  // Lister les clients
  async getClients(page = 1, limit = 10, search?: string): Promise<PaginatedResponse<Client>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await apiClient.get(`/clients?${params}`);
    return response.data;
  }

  // Créer un client
  async createClient(clientData: CreateClientData): Promise<Client> {
    const response = await apiClient.post('/clients', clientData);
    return response.data.data;
  }

  // Récupérer un client par ID
  async getClientById(id: number): Promise<Client> {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data.data;
  }

  // Modifier un client
  async updateClient(id: number, clientData: Partial<CreateClientData>): Promise<Client> {
    const response = await apiClient.put(`/clients/${id}`, clientData);
    return response.data.data;
  }

  // Supprimer un client
  async deleteClient(id: number): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  }
}

export const clientService = new ClientService();