import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { UnknownRecord } from '@/types';
import { logger } from '@/utils/logger';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private requestQueue: Array<() => void> = [];
  private isRefreshing = false;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
      timeout: import.meta.env.VITE_API_TIMEOUT || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokensFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor pour gérer le refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Gestion spéciale pour erreur 429 (Rate Limiting)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 2;
          logger.warn(`Rate limit atteint, attente de ${retryAfter} secondes...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          // Retry automatique une seule fois
          if (!error.config._retryCount) {
            error.config._retryCount = 1;
            return this.client(error.config);
          }
        }
        // Gestion spéciale pour erreur 429 (Rate Limiting)
        if (error.response?.status === 429) {
          logger.warn('Rate limit atteint, attente de 2 secondes...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Retry automatique une seule fois
          if (!error.config._retryCount) {
            error.config._retryCount = 1;
            return this.client(error.config);
          }
        }
        
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && !this.isRefreshing) {
          originalRequest._retry = true;

          // Si déjà en cours de refresh, ajouter à la queue
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.requestQueue.push(() => {
                originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
                resolve(this.client(originalRequest));
              });
            });
          }

          this.isRefreshing = true;

          try {
            await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            
            // Traiter la queue des requêtes en attente
            this.requestQueue.forEach(callback => callback());
            this.requestQueue = [];
            
            return this.client(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokensToStorage(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`, {
      refreshToken: this.refreshToken,
    });

    const { accessToken } = response.data.data;
    this.accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);
  }

  public async login(email: string, motDePasse: string): Promise<ApiResponse> {
    const response = await this.client.post('/api/auth/login', {
      email,
      motDePasse,
    });

    const { tokens } = response.data.data;
    this.saveTokensToStorage(tokens.accessToken, tokens.refreshToken);

    return response.data;
  }

  public logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: UnknownRecord, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Nettoyer les données avant envoi - supprimer seulement undefined
    if (data && typeof data === 'object') {
      // Supprimer seulement les valeurs undefined, garder null et chaînes vides
      const cleanData: UnknownRecord = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          cleanData[key] = value;
        }
      }
      data = cleanData;
    }
    
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      logger.debug('API POST:', { url, data });
    }
    
    const response = await this.client.post(url, data, config);
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      logger.debug('API Response:', response.data);
    }
    return response.data;
  }

  public async put<T>(url: string, data?: UnknownRecord, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: UnknownRecord, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const apiClient = new ApiClient();