import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import  Button  from '../components/ui/Button.tsx'; // Assurez-vous que le chemin est correct

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback = <Navigate to="/login" replace />,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // --- CORRECTION CLÉ : On ne redirige plus automatiquement ---
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-700 mb-2">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <div className="text-left bg-gray-100 p-4 rounded-md text-sm mt-6">
            <p className="font-semibold">Détails du débogage :</p>
            <p><strong>Votre rôle :</strong> {user?.role?.libelle || 'Non défini'}</p>
            <p><strong>Rôles requis :</strong> {requiredRoles.join(', ')}</p>
          </div>
          <Button onClick={() => window.history.back()} className="mt-6">
            Retour à la page précédente
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
