import { apiClient } from '@/lib/api';

export interface AppSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  pageSize: number;
  autoSave: boolean;
  compactMode: boolean;
  theme: 'light' | 'dark';
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginNotifications: boolean;
}

export const settingsService = {
  // Paramètres application
  async getAppSettings(): Promise<AppSettings> {
    try {
      const response = await apiClient.get('/api/settings/app');
      return response.data;
    } catch (error) {
      // Fallback avec paramètres par défaut
      return {
        language: 'fr',
        timezone: 'Africa/Abidjan',
        dateFormat: 'dd/MM/yyyy',
        currency: 'XOF',
        pageSize: 10,
        autoSave: true,
        compactMode: false,
        theme: 'light',
      };
    }
  },

  async updateAppSettings(settings: Partial<AppSettings>) {
    try {
      const response = await apiClient.put('/api/settings/app', settings);
      return response.data;
    } catch (error) {
      // Sauvegarder localement si API non disponible
      const currentSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem('appSettings', JSON.stringify(newSettings));
      return newSettings;
    }
  },

  // Paramètres de sécurité
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const response = await apiClient.get('/api/settings/security');
      return response.data;
    } catch (error) {
      return {
        twoFactorEnabled: false,
        sessionTimeout: 3600, // 1 heure
        passwordExpiry: 90, // 90 jours
        loginNotifications: true,
      };
    }
  },

  async updateSecuritySettings(settings: Partial<SecuritySettings>) {
    return apiClient.put('/api/settings/security', settings);
  },

  // Export/Import des paramètres
  async exportSettings() {
    try {
      const [appSettings, securitySettings] = await Promise.all([
        this.getAppSettings(),
        this.getSecuritySettings()
      ]);

      const exportData = {
        app: appSettings,
        security: securitySettings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      // Créer et télécharger le fichier
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progitek-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return exportData;
    } catch (error) {
      throw new Error('Erreur lors de l\'export des paramètres');
    }
  },

  async importSettings(file: File) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.app || !importData.version) {
        throw new Error('Format de fichier invalide');
      }

      // Importer les paramètres
      await Promise.all([
        this.updateAppSettings(importData.app),
        importData.security ? this.updateSecuritySettings(importData.security) : Promise.resolve()
      ]);

      return importData;
    } catch (error) {
      throw new Error('Erreur lors de l\'import des paramètres');
    }
  },

  // Réinitialisation
  async resetToDefaults() {
    const defaultSettings: AppSettings = {
      language: 'fr',
      timezone: 'Africa/Abidjan',
      dateFormat: 'dd/MM/yyyy',
      currency: 'XOF',
      pageSize: 10,
      autoSave: true,
      compactMode: false,
      theme: 'light',
    };

    await this.updateAppSettings(defaultSettings);
    localStorage.removeItem('appSettings');
    
    return defaultSettings;
  }
};