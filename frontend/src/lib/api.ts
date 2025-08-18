// Fichier : /var/www/progiteck/frontend/src/lib/api.ts

import axios, { 
  AxiosInstance, 
  AxiosError, 
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosRequestConfig // CORRECTION : Ajout de l'import manquant
} from 'axios';
import { UnknownRecord } from '@/types';
import { logger } from '@/utils/logger';

// Interface pour la réponse standard de votre API
interface ApiResponse<T = unknown> {
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

// Interface personnalisée pour la configuration des requêtes
interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private readonly client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private readonly requestQueue: Array<() => void> = [];
  private isRefreshing = false;

  constructor() {
    const baseURL = this.getBaseUrl();
    this.client = axios.create({
      baseURL,
      timeout: this.getTimeout(),
      headers: this.getDefaultHeaders(),
    });

    this.setupInterceptors();
    this.loadTokens();
  }

  private getBaseUrl(): string {
    if (import.meta.env.PROD) {
      return '/';
    }
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  private getTimeout( ): number {
    return parseInt(import.meta.env.VITE_API_TIMEOUT || '30000');
  }

  private getDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(import.meta.env.VITE_APP_NAME && { 'X-App-Name': import.meta.env.VITE_APP_NAME }),
      ...(import.meta.env.VITE_APP_VERSION && { 'X-App-Version': import.meta.env.VITE_APP_VERSION })
    };
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => this.handleRequest(config),
      (error: AxiosError) => Promise.reject(error)
    );
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => this.handleError(error)
    );
  }

  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    if (this.accessToken) {
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }
    return config;
  }

  private async handleError(error: AxiosError) {
    const config = error.config as RetryableAxiosRequestConfig;
    if (!config) return Promise.reject(error);

    if (error.response?.status === 429) {
      return this.handleRateLimit(error);
    }

    if (error.response?.status === 401 && !config._retry) {
      return this.handleUnauthorized(error);
    }

    this.logError(error);
    return Promise.reject(error);
  }

  private async handleRateLimit(error: AxiosError) {
    const retryAfterHeader = error.response?.headers?.['retry-after'];
    const retryAfter = typeof retryAfterHeader === 'string' ? parseInt(retryAfterHeader, 10) : 2;
    logger.warn(`Rate limit reached, waiting ${retryAfter} seconds...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return this.client(error.config as InternalAxiosRequestConfig);
  }

  private async handleUnauthorized(error: AxiosError) {
    const originalRequest = error.config as RetryableAxiosRequestConfig;
    originalRequest._retry = true;

    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.requestQueue.push(() => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
          }
          resolve(this.client(originalRequest));
        });
      });
    }

    this.isRefreshing = true;

    try {
      await this.refreshAccessToken();
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      this.processRequestQueue();
      return this.client(originalRequest);
    } catch (refreshError) {
      this.handleRefreshError(refreshError);
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
    }
  }

  private processRequestQueue() {
    this.requestQueue.forEach(callback => callback());
    this.requestQueue.length = 0;
  }

  private handleRefreshError(error: unknown) {
    this.logout();
    if (this.shouldReportErrors()) {
      logger.error('Refresh token failed, logging out.', error);
    }
  }

  private logError(error: AxiosError) {
    if (this.shouldReportErrors()) {
      logger.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }

  private shouldReportErrors(): boolean {
    return import.meta.env['VITE_ENABLE_ERROR_REPORTING'] === 'true';
  }

  private loadTokens() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await this.client.post('/api/auth/refresh', {
      refreshToken: this.refreshToken,
    });

    const newAccessToken = response.data?.data?.accessToken;
    if (typeof newAccessToken === 'string') {
      this.accessToken = newAccessToken;
      localStorage.setItem('accessToken', this.accessToken);
    } else {
      throw new Error('Invalid access token received from refresh endpoint');
    }
  }

  public async login(email: string, password: string): Promise<ApiResponse<any>> {
    const response = await this.client.post('/api/auth/login', { email, motDePasse: password });
    if (response.data.success && response.data.data?.tokens) {
      this.saveTokens(response.data.data.tokens);
      this.trackEvent('UserLogin', { email });
    }
    return response.data;
  }

  private saveTokens(tokens: { accessToken: string; refreshToken: string }) {
    // CORRECTION : On s'assure que les tokens sont bien des chaînes avant de les sauvegarder
    if (typeof tokens.accessToken === 'string' && typeof tokens.refreshToken === 'string') {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('refreshToken', this.refreshToken);
    } else {
      logger.error('Invalid tokens received from login endpoint', tokens);
    }
  }

  public logout(): void {
    this.trackEvent('UserLogout');
    this.clearTokens();
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private trackEvent(eventName: string, payload?: UnknownRecord) {
    if (this.shouldTrackAnalytics()) {
      logger.debug(`Tracking event: ${eventName}`, payload);
    }
  }

  private shouldTrackAnalytics(): boolean {
    return import.meta.env['VITE_ENABLE_ANALYTICS'] === 'true';
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: UnknownRecord, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: UnknownRecord, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
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
