import { apiClient } from './api';
import { User, PaginatedResponse } from '../types/api';

export interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  phone?: string;
  roleId: number;
}

export interface UpdateUserData {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  phone?: string;
  theme?: string;
  displayName?: string;
  address?: string;
  state?: string;
  country?: string;
  designation?: string;
  status?: string;
  roleId?: number;
}

class UserService {
  // Lister les utilisateurs (Admin)
  async getUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get(`/users?page=${page}&limit=${limit}`);
    return response.data;
  }

  // Créer un utilisateur (Admin)
  async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post('/users', userData);
    return response.data.data;
  }

  // Récupérer un utilisateur par ID (Admin)
  async getUserById(id: number): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  }

  // Modifier un utilisateur (Admin)
  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data.data;
  }

  // Supprimer un utilisateur (Admin)
  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  // Modifier son profil
  async updateProfile(userData: UpdateUserData): Promise<User> {
    const response = await apiClient.put('/users/profile', userData);
    return response.data.data;
  }

  // Récupérer les rôles
  async getRoles(): Promise<any[]> {
    try {
      const response = await apiClient.get('/roles');
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
      return [];
    }
  }
}

export const userService = new UserService();