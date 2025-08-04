import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ AMÉLIORATION : Mémorisation de la fonction checkAuthStatus
  const checkAuthStatus = useCallback(async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const response = await apiClient.get('/api/users/profile');
        setUser(response.data);
      }
    } catch (error) {
      logger.error('Auth check failed:', error);
      apiClient.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email: string, motDePasse: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, motDePasse);
      setUser(response.data.user);
      toast.success('Connexion réussie');
    } catch (error: any) {
      logger.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    apiClient.logout();
    setUser(null);
    toast.success('Déconnexion réussie');
  }, []);

  // ✅ AMÉLIORATION : Fonction pour rafraîchir les données utilisateur
  const refreshUser = useCallback(async () => {
    if (!apiClient.isAuthenticated()) {
      return;
    }
    
    try {
      const response = await apiClient.get('/api/users/profile');
      setUser(response.data);
    } catch (error) {
      logger.error('User refresh failed:', error);
      // Ne pas déconnecter automatiquement en cas d'erreur de rafraîchissement
    }
  }, []);

  // ✅ AMÉLIORATION : Mémorisation de la fonction hasRole
  const hasRole = useCallback((roles: string[]): boolean => {
    return user ? roles.includes(user.role.libelle) : false;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
