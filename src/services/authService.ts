import { apiClient } from './api';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  phone?: string;
  theme?: string;
  displayName?: string;
  address?: string;
  state?: string;
  country?: string;
  designation?: string;
  balance?: number;
  emailStatus?: string;
  kycStatus?: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  role: {
    id: number;
    libelle: string;
    description?: string;
  };
}

export interface LoginCredentials {
  email: string;
  motDePasse: string;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

class AuthService {
  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const { user, tokens } = response.data.data;

    // Stocker les tokens
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data.data;
  }

  // Inscription
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', userData);
    const { user, tokens } = response.data.data;

    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data.data;
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Récupérer le profil
  async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  // Récupérer l'utilisateur depuis le localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Vérifier le rôle
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role.libelle === role;
  }
}

export const authService = new AuthService();