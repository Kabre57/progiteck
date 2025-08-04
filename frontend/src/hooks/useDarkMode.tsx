import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const DarkModeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      // ✅ AMÉLIORATION : Détection automatique du thème système
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (error) {
      console.error('Erreur lors de la lecture du localStorage pour darkMode:', error);
      return false;
    }
  });

  // ✅ AMÉLIORATION : Écoute des changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Seulement si l'utilisateur n'a pas défini de préférence explicite
      const savedPreference = localStorage.getItem('darkMode');
      if (savedPreference === null) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du darkMode:', error);
    }

    // ✅ AMÉLIORATION : Application plus robuste des classes CSS
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    // ✅ AMÉLIORATION : Mise à jour de la meta theme-color pour les navigateurs mobiles
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDarkMode ? '#1f2937' : '#ffffff');
    }
  }, [isDarkMode]);

  // ✅ AMÉLIORATION : Mémorisation des fonctions
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const setDarkMode = useCallback((enabled: boolean) => {
    setIsDarkMode(enabled);
  }, []);

  return (
    <DarkModeContext.Provider value={{ 
      isDarkMode, 
      toggleDarkMode, 
      setDarkMode 
    }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};
