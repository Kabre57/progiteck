import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserPermission {
  resource: string;
  action: string;
  granted: boolean;
  source: 'role' | 'direct';
}

export interface PermissionCheck {
  hasPermission: boolean;
  source?: 'role' | 'direct';
}

class PermissionService {
  private cache = new Map<string, UserPermission[]>();
  private readonly TTL = 300000; // 5 minutes
  private readonly timestamps = new Map<string, number>();

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  async hasPermission(userId: number, resource: string, action: string): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      
      // Vérifier les permissions directes (priorité)
      const directPermission = permissions.find(
        p => p.resource === resource && p.action === action && p.source === 'direct'
      );
      
      if (directPermission) {
        return directPermission.granted;
      }
      
      // Vérifier les permissions de rôle
      const rolePermission = permissions.find(
        p => p.resource === resource && p.action === action && p.source === 'role'
      );
      
      return rolePermission ? rolePermission.granted : false;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  /**
   * Récupère toutes les permissions effectives d'un utilisateur
   */
  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    const cacheKey = `user_${userId}`;
    const cached = this.cache.get(cacheKey);
    const timestamp = this.timestamps.get(cacheKey);

    if (cached && timestamp && Date.now() - timestamp < this.TTL) {
      return cached;
    }

    const permissions = await this.loadUserPermissions(userId);
    this.cache.set(cacheKey, permissions);
    this.timestamps.set(cacheKey, Date.now());

    return permissions;
  }

  /**
   * Charge les permissions depuis la base de données
   */
  private async loadUserPermissions(userId: number): Promise<UserPermission[]> {
    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        userPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return [];
    }

    const permissions: UserPermission[] = [];

    // Ajouter les permissions de rôle
    if (user.role?.rolePermissions) {
      for (const rolePermission of user.role.rolePermissions) {
        permissions.push({
          resource: rolePermission.permission.resource,
          action: rolePermission.permission.action,
          granted: true,
          source: 'role'
        });
      }
    }

    // Ajouter les permissions directes (peuvent override les permissions de rôle)
    for (const userPermission of user.userPermissions) {
      const existingIndex = permissions.findIndex(
        p => p.resource === userPermission.permission.resource && 
            p.action === userPermission.permission.action
      );

      if (existingIndex >= 0) {
        // Remplacer la permission de rôle par la permission directe
        permissions[existingIndex] = {
          resource: userPermission.permission.resource,
          action: userPermission.permission.action,
          granted: userPermission.granted,
          source: 'direct'
        };
      } else {
        // Ajouter une nouvelle permission directe
        permissions.push({
          resource: userPermission.permission.resource,
          action: userPermission.permission.action,
          granted: userPermission.granted,
          source: 'direct'
        });
      }
    }

    return permissions;
  }

  /**
   * Accorde une permission directe à un utilisateur
   */
  async grantPermission(
    userId: number, 
    resource: string, 
    action: string, 
    grantedBy: number
  ): Promise<void> {
    try {
      // Vérifier si la permission existe
      let permission = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } }
      });

      if (!permission) {
        // Créer la permission si elle n'existe pas
        permission = await prisma.permission.create({
          data: { resource, action, description: `${action} ${resource}` }
        });
      }

      // Créer ou mettre à jour la permission utilisateur
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        update: {
          granted: true,
          createdBy: grantedBy
        },
        create: {
          userId,
          permissionId: permission.id,
          granted: true,
          createdBy: grantedBy
        }
      });

      // Invalider le cache
      this.invalidateUser(userId);
    } catch (error) {
      console.error('Erreur lors de l\'octroi de permission:', error);
      throw error;
    }
  }

  /**
   * Révoque une permission directe d'un utilisateur
   */
  async revokePermission(
    userId: number, 
    resource: string, 
    action: string, 
    revokedBy: number
  ): Promise<void> {
    try {
      const permission = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } }
      });

      if (!permission) {
        return; // Permission n'existe pas
      }

      // Marquer la permission comme refusée
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        update: {
          granted: false,
          createdBy: revokedBy
        },
        create: {
          userId,
          permissionId: permission.id,
          granted: false,
          createdBy: revokedBy
        }
      });

      // Invalider le cache
      this.invalidateUser(userId);
    } catch (error) {
      console.error('Erreur lors de la révocation de permission:', error);
      throw error;
    }
  }

  /**
   * Assigne un rôle à un utilisateur
   */
  async assignRole(userId: number, roleId: number): Promise<void> {
    try {
      await prisma.utilisateur.update({
        where: { id: userId },
        data: { roleId }
      });

      // Invalider le cache
      this.invalidateUser(userId);
    } catch (error) {
      console.error('Erreur lors de l\'assignation de rôle:', error);
      throw error;
    }
  }

  /**
   * Récupère les permissions d'un rôle
   */
  async getRolePermissions(roleId: number) {
    return await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true
      }
    });
  }

  /**
   * Met à jour les permissions d'un rôle
   */
  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    try {
      // Supprimer toutes les permissions existantes du rôle
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      });

      // Ajouter les nouvelles permissions
      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId,
            permissionId
          }))
        });
      }

      // Invalider le cache pour tous les utilisateurs de ce rôle
      const users = await prisma.utilisateur.findMany({
        where: { roleId },
        select: { id: true }
      });

      for (const user of users) {
        this.invalidateUser(user.id);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions de rôle:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les permissions disponibles
   */
  async getAllPermissions() {
    return await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });
  }

  /**
   * Crée une nouvelle permission
   */
  async createPermission(resource: string, action: string, description?: string) {
    return await prisma.permission.create({
      data: {
        resource,
        action,
        description: description || `${action} ${resource}`
      }
    });
  }

  /**
   * Invalide le cache d'un utilisateur
   */
  invalidateUser(userId: number): void {
    const cacheKey = `user_${userId}`;
    this.cache.delete(cacheKey);
    this.timestamps.delete(cacheKey);
  }

  /**
   * Vide tout le cache
   */
  clearCache(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  /**
   * Vérifie si un utilisateur peut effectuer une action sur une ressource qui lui appartient
   */
  async hasOwnershipPermission(
    userId: number, 
    resource: string, 
    action: string, 
    resourceOwnerId: number
  ): Promise<boolean> {
    // Vérifier d'abord la permission globale
    const hasGlobalPermission = await this.hasPermission(userId, resource, action);
    if (hasGlobalPermission) {
      return true;
    }

    // Vérifier si l'utilisateur est propriétaire de la ressource
    return userId === resourceOwnerId;
  }
}

export const permissionService = new PermissionService();
export default permissionService;

