import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { permissionService } from '../services/permissionService';
import { successResponse, errorResponse } from '../utils/response';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email?: string;
    role?: string;
  };
}

/**
 * Récupère toutes les permissions disponibles
 */
export const getAllPermissions = async (_req: Request, res: Response) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    
    // Grouper les permissions par ressource
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource]!.push(permission);
      return acc;
    }, {} as Record<string, any[]>);

    return successResponse(res, 'Permissions récupérées avec succès', {
      permissions,
      groupedPermissions
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    return errorResponse(res, 'Erreur lors de la récupération des permissions', 500);
  }
};

/**
 * Récupère les permissions d'un utilisateur
 */
export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId || '');
    
    if (isNaN(userId)) {
      return errorResponse(res, 'ID utilisateur invalide', 400);
    }

    const permissions = await permissionService.getUserPermissions(userId);
    
    // Séparer les permissions par source
    const rolePermissions = permissions.filter(p => p.source === 'role');
    const directPermissions = permissions.filter(p => p.source === 'direct');

    return successResponse(res, 'Permissions utilisateur récupérées avec succès', {
      userId,
      permissions,
      rolePermissions,
      directPermissions
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions utilisateur:', error);
    return errorResponse(res, 'Erreur lors de la récupération des permissions utilisateur', 500);
  }
};

/**
 * Accorde une permission directe à un utilisateur
 */
export const grantUserPermission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId || '');
    const { resource, action } = req.body;
    const grantedBy = req.user?.id;

    if (isNaN(userId)) {
      return errorResponse(res, 'ID utilisateur invalide', 400);
    }

    if (!resource || !action) {
      return errorResponse(res, 'Ressource et action sont requis', 400);
    }

    if (!grantedBy) {
      return errorResponse(res, 'Utilisateur non authentifié', 401);
    }

    // Vérifier que l'utilisateur cible existe
    const targetUser = await prisma.utilisateur.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return errorResponse(res, 'Utilisateur non trouvé', 404);
    }

    await permissionService.grantPermission(userId, resource, action, grantedBy);

    return successResponse(res, 'Permission accordée avec succès', {
      userId,
      resource,
      action,
      grantedBy
    });
  } catch (error) {
    console.error('Erreur lors de l\'octroi de permission:', error);
    return errorResponse(res, 'Erreur lors de l\'octroi de permission', 500);
  }
};

/**
 * Révoque une permission directe d'un utilisateur
 */
export const revokeUserPermission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId || '');
    const { resource, action } = req.body;
    const revokedBy = req.user?.id;

    if (isNaN(userId)) {
      return errorResponse(res, 'ID utilisateur invalide', 400);
    }

    if (!resource || !action) {
      return errorResponse(res, 'Ressource et action sont requis', 400);
    }

    if (!revokedBy) {
      return errorResponse(res, 'Utilisateur non authentifié', 401);
    }

    await permissionService.revokePermission(userId, resource, action, revokedBy);

    return successResponse(res, 'Permission révoquée avec succès', {
      userId,
      resource,
      action,
      revokedBy
    });
  } catch (error) {
    console.error('Erreur lors de la révocation de permission:', error);
    return errorResponse(res, 'Erreur lors de la révocation de permission', 500);
  }
};

/**
 * Récupère les permissions d'un rôle
 */
export const getRolePermissions = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.roleId || '');
    
    if (isNaN(roleId)) {
      return errorResponse(res, 'ID rôle invalide', 400);
    }

    // Vérifier que le rôle existe
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return errorResponse(res, 'Rôle non trouvé', 404);
    }

    const rolePermissions = await permissionService.getRolePermissions(roleId);

    return successResponse(res, 'Permissions du rôle récupérées avec succès', {
      role,
      permissions: rolePermissions.map(rp => rp.permission)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions du rôle:', error);
    return errorResponse(res, 'Erreur lors de la récupération des permissions du rôle', 500);
  }
};

/**
 * Met à jour les permissions d'un rôle
 */
export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const roleId = parseInt(req.params.roleId || '');
    const { permissionIds } = req.body;

    if (isNaN(roleId)) {
      return errorResponse(res, 'ID rôle invalide', 400);
    }

    if (!Array.isArray(permissionIds)) {
      return errorResponse(res, 'permissionIds doit être un tableau', 400);
    }

    // Vérifier que le rôle existe et n'est pas un rôle système
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return errorResponse(res, 'Rôle non trouvé', 404);
    }

    if (role.isSystem) {
      return errorResponse(res, 'Impossible de modifier un rôle système', 403);
    }

    // Vérifier que toutes les permissions existent
    if (permissionIds.length > 0) {
      const existingPermissions = await prisma.permission.findMany({
        where: { id: { in: permissionIds } }
      });

      if (existingPermissions.length !== permissionIds.length) {
        return errorResponse(res, 'Certaines permissions n\'existent pas', 400);
      }
    }

    await permissionService.updateRolePermissions(roleId, permissionIds);

    return successResponse(res, 'Permissions du rôle mises à jour avec succès', {
      roleId,
      permissionIds
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des permissions du rôle:', error);
    return errorResponse(res, 'Erreur lors de la mise à jour des permissions du rôle', 500);
  }
};

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export const checkUserPermission = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId || '');
    const { resource, action } = req.query;

    if (isNaN(userId)) {
      return errorResponse(res, 'ID utilisateur invalide', 400);
    }

    if (!resource || !action) {
      return errorResponse(res, 'Ressource et action sont requis', 400);
    }

    const hasPermission = await permissionService.hasPermission(
      userId, 
      resource as string, 
      action as string
    );

    return successResponse(res, 'Vérification de permission effectuée', {
      userId,
      resource,
      action,
      hasPermission
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de permission:', error);
    return errorResponse(res, 'Erreur lors de la vérification de permission', 500);
  }
};

/**
 * Crée une nouvelle permission
 */
export const createPermission = async (req: Request, res: Response) => {
  try {
    const { resource, action, description } = req.body;

    if (!resource || !action) {
      return errorResponse(res, 'Ressource et action sont requis', 400);
    }

    // Vérifier que la permission n'existe pas déjà
    const existingPermission = await prisma.permission.findUnique({
      where: { resource_action: { resource, action } }
    });

    if (existingPermission) {
      return errorResponse(res, 'Cette permission existe déjà', 409);
    }

    const permission = await permissionService.createPermission(resource, action, description);

    return successResponse(res, 'Permission créée avec succès', permission, 201);
  } catch (error) {
    console.error('Erreur lors de la création de permission:', error);
    return errorResponse(res, 'Erreur lors de la création de permission', 500);
  }
};

/**
 * Récupère tous les rôles avec leurs permissions
 */
export const getAllRoles = async (_req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            utilisateurs: true
          }
        }
      },
      orderBy: { libelle: 'asc' }
    });

    return successResponse(res, 'Rôles récupérés avec succès', roles);
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    return errorResponse(res, 'Erreur lors de la récupération des rôles', 500);
  }
};

/**
 * Crée un nouveau rôle
 */
export const createRole = async (req: Request, res: Response) => {
  try {
    const { libelle, description, permissionIds } = req.body;

    if (!libelle) {
      return errorResponse(res, 'Le libellé du rôle est requis', 400);
    }

    // Vérifier que le rôle n'existe pas déjà
    const existingRole = await prisma.role.findUnique({
      where: { libelle }
    });

    if (existingRole) {
      return errorResponse(res, 'Un rôle avec ce libellé existe déjà', 409);
    }

    // Créer le rôle
    const role = await prisma.role.create({
      data: {
        libelle,
        description
      }
    });

    // Ajouter les permissions si spécifiées
    if (permissionIds && Array.isArray(permissionIds) && permissionIds.length > 0) {
      await permissionService.updateRolePermissions(role.id, permissionIds);
    }

    return successResponse(res, 'Rôle créé avec succès', role, 201);
  } catch (error) {
    console.error('Erreur lors de la création du rôle:', error);
    return errorResponse(res, 'Erreur lors de la création du rôle', 500);
  }
};

export default {
  getAllPermissions,
  getUserPermissions,
  grantUserPermission,
  revokeUserPermission,
  getRolePermissions,
  updateRolePermissions,
  checkUserPermission,
  createPermission,
  getAllRoles,
  createRole
};