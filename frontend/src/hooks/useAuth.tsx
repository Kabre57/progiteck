import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, motDePasse: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const response = await apiClient.get('/api/users/profile');
        if (response.success) {
          setUser(response.data);
        } else {
          // Si le token est valide mais que le profil n'est pas trouvé, déconnecter
          apiClient.logout();
          setUser(null);
        }
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
      if (response.success) {
        setUser(response.data.user);
        toast.success('Connexion réussie');
      } else {
        // Gérer les erreurs de login renvoyées par l'API
        const errorMessage = response.message || 'Erreur de connexion';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      logger.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || 'Une erreur de réseau est survenue.';
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

  const refreshUser = useCallback(async () => {
    if (!apiClient.isAuthenticated()) return;
    try {
      const response = await apiClient.get('/api/users/profile');
      if (response.success) {
        setUser(response.data);
      }
    } catch (error) {
      logger.error('User refresh failed:', error);
    }
  }, []);

  // =================================================================
  // === CORRECTION CLÉ : Logique du Super Administrateur ===
  // =================================================================
  const hasRole = useCallback((requiredRoles: string[]): boolean => {
    if (!user || !user.role) {
      return false;
    }

    // Si l'utilisateur est ADMIN, il a accès à tout.
    if (user.role.libelle === 'ADMIN') {
      return true;
    }

    // Sinon, on vérifie si son rôle est dans la liste des rôles requis.
    return requiredRoles.includes(user.role.libelle);
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

// Note : Le hook useAuth n'a pas besoin d'être modifié, il consomme directement le contexte.
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
