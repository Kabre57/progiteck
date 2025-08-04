import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsService, AppSettings } from '@/services/settingsService';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<void>;
  importSettings: (file: File) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>({
    language: 'fr',
    timezone: 'Africa/Abidjan',
    dateFormat: 'dd/MM/yyyy',
    currency: 'XOF',
    pageSize: 10,
    autoSave: true,
    compactMode: false,
    theme: 'light',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const loadedSettings = await settingsService.getAppSettings();
      setSettings(loadedSettings);
      
      // Appliquer les paramètres au DOM
      applySettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySettings = (newSettings: AppSettings) => {
    // Appliquer le thème
    if (newSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Appliquer le mode compact
    if (newSettings.compactMode) {
      document.documentElement.classList.add('compact');
    } else {
      document.documentElement.classList.remove('compact');
    }

    // Appliquer la langue
    document.documentElement.lang = newSettings.language;
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await settingsService.updateAppSettings(newSettings);
      setSettings(updatedSettings);
      applySettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    setLoading(true);
    try {
      const defaultSettings = await settingsService.resetToDefaults();
      setSettings(defaultSettings);
      applySettings(defaultSettings);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const exportSettings = async () => {
    try {
      await settingsService.exportSettings();
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  };

  const importSettings = async (file: File) => {
    setLoading(true);
    try {
      const importedData = await settingsService.importSettings(file);
      setSettings(importedData.app);
      applySettings(importedData.app);
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        exportSettings,
        importSettings,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};