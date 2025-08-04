// Configuration constants from environment variables
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
} as const;

export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
  ALLOWED_FILE_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'application/pdf'
  ],
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 10,
  MAX_PAGE_SIZE: Number(import.meta.env.VITE_MAX_PAGE_SIZE) || 100,
} as const;

export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Progitek System',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  SHOW_API_LOGS: import.meta.env.VITE_SHOW_API_LOGS === 'true',
} as const;

// Routes configuration
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  TECHNICIENS: '/techniciens',
  MISSIONS: '/missions',
  INTERVENTIONS: '/interventions',
} as const;

// Role permissions
export const PERMISSIONS = {
  ADMIN: ['admin'],
  MANAGER: ['admin', 'manager'],
  COMMERCIAL: ['admin', 'manager', 'commercial'],
  TECHNICIEN: ['admin', 'manager', 'technicien'],
  ALL_AUTHENTICATED: ['admin', 'manager', 'commercial', 'technicien', 'user'],
} as const;