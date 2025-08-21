import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { requirePermission, requireAnyPermission, requireAllPermissions } from '../src/middleware/permissions';
import { permissionService } from '../src/services/permissionService';

// Mock du service de permissions
jest.mock('../src/services/permissionService');
const mockPermissionService = permissionService as jest.Mocked<typeof permissionService>;

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email?: string;
    role?: string;
  };
}

describe('Permission Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 1,
        email: 'test@example.com',
        role: 'user'
      },
      ip: '127.0.0.1'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Reset des mocks
    jest.clearAllMocks();
  });

  describe('requirePermission', () => {
    it('devrait appeler next() si l\'utilisateur a la permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(true);

      const middleware = requirePermission('clients', 'read');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(1, 'clients', 'read');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('devrait retourner 403 si l\'utilisateur n\'a pas la permission', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);

      const middleware = requirePermission('clients', 'create');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(1, 'clients', 'create');
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Permission insuffisante',
        message: 'Vous n\'avez pas la permission d\'effectuer cette action (clients:create)',
        required: 'clients:create'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait retourner 401 si l\'utilisateur n\'est pas authentifié', async () => {
      mockReq.user = undefined;

      const middleware = requirePermission('clients', 'read');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait retourner 500 en cas d\'erreur du service', async () => {
      mockPermissionService.hasPermission.mockRejectedValue(new Error('Database error'));

      const middleware = requirePermission('clients', 'read');
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la vérification des permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAnyPermission', () => {
    it('devrait appeler next() si l\'utilisateur a au moins une permission', async () => {
      mockPermissionService.hasPermission
        .mockResolvedValueOnce(false) // première permission refusée
        .mockResolvedValueOnce(true);  // deuxième permission accordée

      const permissions = [
        { resource: 'clients', action: 'create' },
        { resource: 'clients', action: 'update' }
      ];

      const middleware = requireAnyPermission(permissions);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('devrait retourner 403 si l\'utilisateur n\'a aucune des permissions', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(false);

      const permissions = [
        { resource: 'clients', action: 'create' },
        { resource: 'clients', action: 'update' }
      ];

      const middleware = requireAnyPermission(permissions);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Permission insuffisante',
        message: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action',
        required: 'clients:create OR clients:update'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAllPermissions', () => {
    it('devrait appeler next() si l\'utilisateur a toutes les permissions', async () => {
      mockPermissionService.hasPermission.mockResolvedValue(true);

      const permissions = [
        { resource: 'clients', action: 'read' },
        { resource: 'clients', action: 'update' }
      ];

      const middleware = requireAllPermissions(permissions);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('devrait retourner 403 si l\'utilisateur n\'a pas toutes les permissions', async () => {
      mockPermissionService.hasPermission
        .mockResolvedValueOnce(true)  // première permission accordée
        .mockResolvedValueOnce(false); // deuxième permission refusée

      const permissions = [
        { resource: 'clients', action: 'read' },
        { resource: 'clients', action: 'delete' }
      ];

      const middleware = requireAllPermissions(permissions);
      await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockPermissionService.hasPermission).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Permission insuffisante',
        message: 'Vous n\'avez pas toutes les permissions nécessaires pour effectuer cette action',
        required: 'clients:read AND clients:delete'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});

describe('Permission Middleware Integration', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: { id: 1 },
      ip: '127.0.0.1'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('devrait gérer les permissions contextuelles', async () => {
    // Simuler un middleware de propriété
    const getOwnerId = jest.fn().mockResolvedValue(1); // L'utilisateur est propriétaire

    mockPermissionService.hasPermission.mockResolvedValue(false); // Pas de permission globale

    // Créer un middleware personnalisé pour tester la logique de propriété
    const requireOwnershipOrPermission = (
      resource: string,
      action: string,
      getOwnerIdFn: (req: AuthenticatedRequest) => Promise<number | null>
    ) => {
      return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Non authentifié' });
        }

        // Vérifier permission globale
        const hasGlobalPermission = await mockPermissionService.hasPermission(userId, resource, action);
        if (hasGlobalPermission) {
          return next();
        }

        // Vérifier propriété
        const ownerId = await getOwnerIdFn(req);
        if (ownerId && userId === ownerId) {
          return next();
        }

        return res.status(403).json({ error: 'Permission insuffisante' });
      };
    };

    const middleware = requireOwnershipOrPermission('rapports', 'update', getOwnerId);
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockPermissionService.hasPermission).toHaveBeenCalledWith(1, 'rapports', 'update');
    expect(getOwnerId).toHaveBeenCalledWith(mockReq);
    expect(mockNext).toHaveBeenCalled(); // Devrait passer car l'utilisateur est propriétaire
  });

  it('devrait refuser l\'accès si ni permission globale ni propriété', async () => {
    const getOwnerId = jest.fn().mockResolvedValue(2); // Autre utilisateur propriétaire

    mockPermissionService.hasPermission.mockResolvedValue(false);

    const requireOwnershipOrPermission = (
      resource: string,
      action: string,
      getOwnerIdFn: (req: AuthenticatedRequest) => Promise<number | null>
    ) => {
      return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Non authentifié' });
        }

        const hasGlobalPermission = await mockPermissionService.hasPermission(userId, resource, action);
        if (hasGlobalPermission) {
          return next();
        }

        const ownerId = await getOwnerIdFn(req);
        if (ownerId && userId === ownerId) {
          return next();
        }

        return res.status(403).json({ error: 'Permission insuffisante' });
      };
    };

    const middleware = requireOwnershipOrPermission('rapports', 'update', getOwnerId);
    await middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });
});

