import { apiClient } from './api';
import { Role, PaginatedResponse } from '../types/api';

export interface CreateRoleData {
  libelle: string;
  description?: string;
}

class RoleService {
  // Lister les rôles
  async getRoles(page = 1, limit = 10): Promise<PaginatedResponse<Role>> {
    const response = await apiClient.get(`/roles?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Créer un rôle
  async createRole(roleData: CreateRoleData): Promise<Role> {
    const response = await apiClient.post('/roles', roleData);
    return response.data.data;
  }

  // Récupérer un rôle par ID
  async getRoleById(id: number): Promise<Role> {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data.data;
  }

  // Modifier un rôle
  async updateRole(id: number, roleData: Partial<CreateRoleData>): Promise<Role> {
    const response = await apiClient.put(`/roles/${id}`, roleData);
    return response.data.data;
  }

  // Supprimer un rôle
  async deleteRole(id: number): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  }
}

export const roleService = new RoleService();