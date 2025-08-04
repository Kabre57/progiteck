import { apiClient } from '@/lib/api';
import { User } from '@/types';

export interface CreateUserData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  phone?: string;
  theme?: 'light' | 'dark';
  displayName?: string;
  address?: string;
  state?: string;
  country?: string;
  designation?: string;
  roleId: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateUserData {
  nom?: string;
  prenom?: string;
  email?: string;
  motDePasse?: string;
  phone?: string;
  theme?: 'light' | 'dark';
  displayName?: string;
  address?: string;
  state?: string;
  country?: string;
  designation?: string;
  roleId?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export const userService = {
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return apiClient.get<User[]>(`/api/users?${queryParams.toString()}`);
  },

  async getUserById(id: number) {
    return apiClient.get<User>(`/api/users/${id}`);
  },

  async createUser(data: CreateUserData) {
    return apiClient.post<User>('/api/users', data);
  },

  async updateUser(id: number, data: UpdateUserData) {
    return apiClient.put<User>(`/api/users/${id}`, data);
  },

  async deleteUser(id: number) {
    return apiClient.delete(`/api/users/${id}`);
  },

  async toggleUserStatus(id: number) {
    return apiClient.patch(`/api/users/${id}/toggle-status`);
  },

  async resetUserPassword(id: number, newPassword: string) {
    return apiClient.patch(`/api/users/${id}/reset-password`, { newPassword });
  },

  async getRoles() {
    return apiClient.get('/api/users/roles');
  },

  // Profil personnel
  async getProfile() {
    return apiClient.get<User>('/api/users/profile');
  },

  async updateProfile(data: Partial<UpdateUserData>) {
    return apiClient.put<User>('/api/users/profile', data);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiClient.patch('/api/users/change-password', {
      currentPassword,
      newPassword
    });
  },
};