import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { permissionService } from '../src/services/permissionService';

const prisma = new PrismaClient();

describe('Permission Service', () => {
  let testUserId: number;
  let testRoleId: number;
  let testPermissionId: number;

  beforeAll(async () => {
    // Nettoyer la base de données de test
    await prisma.userPermission.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.utilisateur.deleteMany({});
    await prisma.role.deleteMany({});
  });

  beforeEach(async () => {
    // Créer des données de test
    const testRole = await prisma.role.create({
      data: {
        libelle: 'Test Role',
        description: 'Rôle de test'
      }
    });
    testRoleId = testRole.id;

    const testUser = await prisma.utilisateur.create({
      data: {
        nom: 'Test',
        prenom: 'User',
        email: 'test@example.com',
        motDePasse: 'hashedpassword',
        roleId: testRoleId
      }
    });
    testUserId = testUser.id;

    const testPermission = await prisma.permission.create({
      data: {
        resource: 'test_resource',
        action: 'test_action',
        description: 'Permission de test'
      }
    });
    testPermissionId = testPermission.id;
  });

  afterEach(async () => {
    // Nettoyer après chaque test
    await prisma.userPermission.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.utilisateur.deleteMany({});
    await prisma.role.deleteMany({});
    
    // Vider le cache
    permissionService.clearCache();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('hasPermission', () => {
    it('devrait retourner false pour un utilisateur sans permissions', async () => {
      const hasPermission = await permissionService.hasPermission(
        testUserId, 
        'test_resource', 
        'test_action'
      );
      
      expect(hasPermission).toBe(false);
    });

    it('devrait retourner true pour une permission de rôle', async () => {
      // Ajouter la permission au rôle
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId
        }
      });

      const hasPermission = await permissionService.hasPermission(
        testUserId, 
        'test_resource', 
        'test_action'
      );
      
      expect(hasPermission).toBe(true);
    });

    it('devrait retourner true pour une permission directe accordée', async () => {
      await permissionService.grantPermission(
        testUserId, 
        'test_resource', 
        'test_action', 
        testUserId
      );

      const hasPermission = await permissionService.hasPermission(
        testUserId, 
        'test_resource', 
        'test_action'
      );
      
      expect(hasPermission).toBe(true);
    });

    it('devrait retourner false pour une permission directe refusée même avec permission de rôle', async () => {
      // Ajouter la permission au rôle
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId
        }
      });

      // Refuser la permission directement
      await permissionService.revokePermission(
        testUserId, 
        'test_resource', 
        'test_action', 
        testUserId
      );

      const hasPermission = await permissionService.hasPermission(
        testUserId, 
        'test_resource', 
        'test_action'
      );
      
      expect(hasPermission).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('devrait retourner les permissions de rôle', async () => {
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId
        }
      });

      const permissions = await permissionService.getUserPermissions(testUserId);
      
      expect(permissions).toHaveLength(1);
      expect(permissions[0].resource).toBe('test_resource');
      expect(permissions[0].action).toBe('test_action');
      expect(permissions[0].source).toBe('role');
      expect(permissions[0].granted).toBe(true);
    });

    it('devrait retourner les permissions directes', async () => {
      await permissionService.grantPermission(
        testUserId, 
        'test_resource', 
        'test_action', 
        testUserId
      );

      const permissions = await permissionService.getUserPermissions(testUserId);
      
      expect(permissions).toHaveLength(1);
      expect(permissions[0].source).toBe('direct');
      expect(permissions[0].granted).toBe(true);
    });

    it('devrait prioriser les permissions directes sur les permissions de rôle', async () => {
      // Ajouter permission de rôle
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId
        }
      });

      // Refuser la permission directement
      await permissionService.revokePermission(
        testUserId, 
        'test_resource', 
        'test_action', 
        testUserId
      );

      const permissions = await permissionService.getUserPermissions(testUserId);
      
      expect(permissions).toHaveLength(1);
      expect(permissions[0].source).toBe('direct');
      expect(permissions[0].granted).toBe(false);
    });
  });

  describe('grantPermission', () => {
    it('devrait créer une nouvelle permission si elle n\'existe pas', async () => {
      await permissionService.grantPermission(
        testUserId, 
        'new_resource', 
        'new_action', 
        testUserId
      );

      const permission = await prisma.permission.findUnique({
        where: { resource_action: { resource: 'new_resource', action: 'new_action' } }
      });

      expect(permission).toBeTruthy();
      expect(permission?.resource).toBe('new_resource');
      expect(permission?.action).toBe('new_action');
    });

    it('devrait créer une permission utilisateur', async () => {
      await permissionService.grantPermission(
        testUserId, 
        'test_resource', 
        'test_action', 
        testUserId
      );

      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId: testUserId,
          permission: {
            resource: 'test_resource',
            action: 'test_action'
          }
        }
      });

      expect(userPermission).toBeTruthy();
      expect(userPermission?.granted).toBe(true);
      expect(userPermission?.createdBy).toBe(testUserId);
    });
  });

  describe('revokePermission', () => {
    it('devrait marquer une permission comme refusée', async () => {
      await permissionService.revokePermission(
        testUserId, 
        'test_resource', 
        'test_action', 
        testUserId
      );

      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId: testUserId,
          permission: {
            resource: 'test_resource',
            action: 'test_action'
          }
        }
      });

      expect(userPermission).toBeTruthy();
      expect(userPermission?.granted).toBe(false);
    });
  });

  describe('updateRolePermissions', () => {
    it('devrait mettre à jour les permissions d\'un rôle', async () => {
      const permission2 = await prisma.permission.create({
        data: {
          resource: 'test_resource2',
          action: 'test_action2'
        }
      });

      await permissionService.updateRolePermissions(testRoleId, [testPermissionId, permission2.id]);

      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: testRoleId }
      });

      expect(rolePermissions).toHaveLength(2);
    });

    it('devrait supprimer les anciennes permissions du rôle', async () => {
      // Ajouter une permission initiale
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId
        }
      });

      // Mettre à jour avec une liste vide
      await permissionService.updateRolePermissions(testRoleId, []);

      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: testRoleId }
      });

      expect(rolePermissions).toHaveLength(0);
    });

    it('devrait invalider le cache des utilisateurs du rôle', async () => {
      // Ajouter une permission au rôle
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId
        }
      });

      // Charger les permissions en cache
      await permissionService.getUserPermissions(testUserId);

      // Mettre à jour les permissions du rôle
      await permissionService.updateRolePermissions(testRoleId, []);

      // Vérifier que le cache a été invalidé
      const permissions = await permissionService.getUserPermissions(testUserId);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('Cache', () => {
    it('devrait utiliser le cache pour les requêtes répétées', async () => {
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          permissionId: testPermissionId
        }
      });

      // Premier appel - charge depuis la DB
      const permissions1 = await permissionService.getUserPermissions(testUserId);
      
      // Deuxième appel - devrait utiliser le cache
      const permissions2 = await permissionService.getUserPermissions(testUserId);

      expect(permissions1).toEqual(permissions2);
    });

    it('devrait invalider le cache lors de modifications', async () => {
      // Charger en cache
      await permissionService.getUserPermissions(testUserId);

      // Modifier les permissions
      await permissionService.grantPermission(
        testUserId, 
        'test_resource', 
        'test_action', 
        testUserId
      );

      // Vérifier que les nouvelles permissions sont visibles
      const permissions = await permissionService.getUserPermissions(testUserId);
      expect(permissions).toHaveLength(1);
      expect(permissions[0].source).toBe('direct');
    });
  });
});

describe('Permission Integration Tests', () => {
  let adminUserId: number;
  let userUserId: number;
  let adminRoleId: number;
  let userRoleId: number;

  beforeAll(async () => {
    // Nettoyer
    await prisma.userPermission.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.utilisateur.deleteMany({});
    await prisma.role.deleteMany({});

    // Créer les rôles
    const adminRole = await prisma.role.create({
      data: {
        libelle: 'Admin',
        description: 'Administrateur'
      }
    });
    adminRoleId = adminRole.id;

    const userRole = await prisma.role.create({
      data: {
        libelle: 'User',
        description: 'Utilisateur standard'
      }
    });
    userRoleId = userRole.id;

    // Créer les permissions
    const permissions = await Promise.all([
      prisma.permission.create({
        data: { resource: 'clients', action: 'read' }
      }),
      prisma.permission.create({
        data: { resource: 'clients', action: 'create' }
      }),
      prisma.permission.create({
        data: { resource: 'clients', action: 'update' }
      }),
      prisma.permission.create({
        data: { resource: 'clients', action: 'delete' }
      })
    ]);

    // Donner toutes les permissions à l'admin
    await Promise.all(
      permissions.map(permission =>
        prisma.rolePermission.create({
          data: {
            roleId: adminRoleId,
            permissionId: permission.id
          }
        })
      )
    );

    // Donner seulement read à l'utilisateur standard
    await prisma.rolePermission.create({
      data: {
        roleId: userRoleId,
        permissionId: permissions[0].id // read permission
      }
    });

    // Créer les utilisateurs
    const adminUser = await prisma.utilisateur.create({
      data: {
        nom: 'Admin',
        prenom: 'User',
        email: 'admin@test.com',
        motDePasse: 'password',
        roleId: adminRoleId
      }
    });
    adminUserId = adminUser.id;

    const normalUser = await prisma.utilisateur.create({
      data: {
        nom: 'Normal',
        prenom: 'User',
        email: 'user@test.com',
        motDePasse: 'password',
        roleId: userRoleId
      }
    });
    userUserId = normalUser.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Admin devrait avoir toutes les permissions clients', async () => {
    const actions = ['read', 'create', 'update', 'delete'];
    
    for (const action of actions) {
      const hasPermission = await permissionService.hasPermission(
        adminUserId, 
        'clients', 
        action
      );
      expect(hasPermission).toBe(true);
    }
  });

  it('Utilisateur standard devrait avoir seulement la permission read', async () => {
    const hasRead = await permissionService.hasPermission(userUserId, 'clients', 'read');
    const hasCreate = await permissionService.hasPermission(userUserId, 'clients', 'create');
    const hasUpdate = await permissionService.hasPermission(userUserId, 'clients', 'update');
    const hasDelete = await permissionService.hasPermission(userUserId, 'clients', 'delete');

    expect(hasRead).toBe(true);
    expect(hasCreate).toBe(false);
    expect(hasUpdate).toBe(false);
    expect(hasDelete).toBe(false);
  });

  it('Permission directe devrait override la permission de rôle', async () => {
    // L'utilisateur a read via son rôle, on lui refuse directement
    await permissionService.revokePermission(userUserId, 'clients', 'read', adminUserId);

    const hasRead = await permissionService.hasPermission(userUserId, 'clients', 'read');
    expect(hasRead).toBe(false);

    // On lui accorde create directement (qu'il n'a pas via son rôle)
    await permissionService.grantPermission(userUserId, 'clients', 'create', adminUserId);

    const hasCreate = await permissionService.hasPermission(userUserId, 'clients', 'create');
    expect(hasCreate).toBe(true);
  });
});

