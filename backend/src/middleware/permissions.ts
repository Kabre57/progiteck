import { Request, Response, NextFunction } from 'express';
import { permissionService } from '../services/permissionService';

// Interface pour les requêtes authentifiées
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email?: string;
    role?: string;
  };
}

/**
 * Middleware pour vérifier les permissions
 */
export const requirePermission = (resource: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Non authentifié',
          message: 'Vous devez être connecté pour accéder à cette ressource'
        });
        return;
      }

      const hasPermission = await permissionService.hasPermission(userId, resource, action);
      
      if (!hasPermission) {
        // Log de la tentative d'accès non autorisée
        console.warn(`Accès refusé - Utilisateur ${userId} - ${resource}:${action} - IP: ${req.ip}`);
        
        res.status(403).json({ 
          success: false,
          error: 'Permission insuffisante',
          message: `Vous n'avez pas la permission d'effectuer cette action (${resource}:${action})`,
          required: `${resource}:${action}`
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour vérifier les permissions avec propriété
 * Permet à un utilisateur d'accéder à ses propres ressources même sans permission globale
 */
export const requireOwnershipOrPermission = (
  resource: string, 
  action: string, 
  getOwnerId: (req: AuthenticatedRequest) => Promise<number | null>
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Non authentifié',
          message: 'Vous devez être connecté pour accéder à cette ressource'
        });
        return;
      }

      // Vérifier d'abord la permission globale
      const hasGlobalPermission = await permissionService.hasPermission(userId, resource, action);
      
      if (hasGlobalPermission) {
        next();
        return;
      }

      // Vérifier la propriété de la ressource
      try {
        const ownerId = await getOwnerId(req);
        
        if (ownerId && userId === ownerId) {
          next();
          return;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de propriété:', error);
      }

      // Aucune permission trouvée
      console.warn(`Accès refusé - Utilisateur ${userId} - ${resource}:${action} - IP: ${req.ip}`);
      
      res.status(403).json({ 
        success: false,
        error: 'Permission insuffisante',
        message: `Vous n'avez pas la permission d'effectuer cette action (${resource}:${action})`,
        required: `${resource}:${action}`
      });
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour vérifier plusieurs permissions (OR)
 * L'utilisateur doit avoir au moins une des permissions listées
 */
export const requireAnyPermission = (permissions: Array<{resource: string, action: string}>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Non authentifié',
          message: 'Vous devez être connecté pour accéder à cette ressource'
        });
        return;
      }

      // Vérifier si l'utilisateur a au moins une des permissions
      for (const permission of permissions) {
        const hasPermission = await permissionService.hasPermission(
          userId, 
          permission.resource, 
          permission.action
        );
        
        if (hasPermission) {
          next();
          return;
        }
      }

      // Aucune permission trouvée
      const requiredPermissions = permissions.map(p => `${p.resource}:${p.action}`).join(' OR ');
      console.warn(`Accès refusé - Utilisateur ${userId} - ${requiredPermissions} - IP: ${req.ip}`);
      
      res.status(403).json({ 
        success: false,
        error: 'Permission insuffisante',
        message: `Vous n'avez pas les permissions nécessaires pour effectuer cette action`,
        required: requiredPermissions
      });
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour vérifier plusieurs permissions (AND)
 * L'utilisateur doit avoir toutes les permissions listées
 */
export const requireAllPermissions = (permissions: Array<{resource: string, action: string}>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ 
          success: false,
          error: 'Non authentifié',
          message: 'Vous devez être connecté pour accéder à cette ressource'
        });
        return;
      }

      // Vérifier que l'utilisateur a toutes les permissions
      for (const permission of permissions) {
        const hasPermission = await permissionService.hasPermission(
          userId, 
          permission.resource, 
          permission.action
        );
        
        if (!hasPermission) {
          const requiredPermissions = permissions.map(p => `${p.resource}:${p.action}`).join(' AND ');
          console.warn(`Accès refusé - Utilisateur ${userId} - ${requiredPermissions} - IP: ${req.ip}`);
          
          res.status(403).json({ 
            success: false,
            error: 'Permission insuffisante',
            message: `Vous n'avez pas toutes les permissions nécessaires pour effectuer cette action`,
            required: requiredPermissions
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Middleware pour charger les permissions de l'utilisateur dans la requête
 * Utile pour les contrôleurs qui ont besoin d'accéder aux permissions
 */
export const loadUserPermissions = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (userId) {
      const permissions = await permissionService.getUserPermissions(userId);
      (req as any).userPermissions = permissions;
    }
    
    next();
  } catch (error) {
    console.error('Erreur lors du chargement des permissions:', error);
    next(); // Continuer même en cas d'erreur
  }
};

/**
 * Fonction utilitaire pour vérifier les permissions dans les contrôleurs
 */
export const checkPermission = async (userId: number, resource: string, action: string): Promise<boolean> => {
  return await permissionService.hasPermission(userId, resource, action);
};

export default {
  requirePermission,
  requireOwnershipOrPermission,
  requireAnyPermission,
  requireAllPermissions,
  loadUserPermissions,
  checkPermission
};