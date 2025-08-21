import { PrismaClient } from '@prisma/client';
import { permissionService } from '../services/permissionService';

const prisma = new PrismaClient();

interface ValidationResult {
  success: boolean;
  message: string;
  details?: any;
  severity?: 'critical' | 'warning' | 'info';
}

class PermissionValidator {
  private results: ValidationResult[] = [];
  private validationStartTime: number = 0;

  async validateSystem(): Promise<ValidationResult[]> {
    this.validationStartTime = Date.now();
    console.log('🔍 Début de la validation complète du système de permissions...\n');

    await this.validateDatabaseIntegrity();
    await this.validatePermissionDefinitions();
    await this.validateRolePermissions();
    await this.validateUserPermissions();
    await this.validatePermissionLogic();
    await this.validatePerformance();
    await this.validateSecurityConstraints();

    this.printSummary();
    return this.results;
  }

private async validateDatabaseIntegrity(): Promise<void> {
    console.log('📊 Validation de l\'intégrité de la base de données...');

    try {
      // Vérifier que toutes les tables existent et ont des données
      const tables = {
        permissions: await prisma.permission.count(),
        roles: await prisma.role.count(),
        users: await prisma.utilisateur.count(),
        rolePermissions: await prisma.rolePermission.count(),
        userPermissions: await prisma.userPermission.count()
      };

      if (tables.permissions === 0) {
        this.addResult(false, 'AUCUNE PERMISSION trouvée dans la base de données', null, 'critical');
      }

      if (tables.roles === 0) {
        this.addResult(false, 'AUCUN RÔLE trouvé dans la base de données', null, 'critical');
      }

      if (tables.users === 0) {
        this.addResult(false, 'AUCUN UTILISATEUR trouvé dans la base de données', null, 'critical');
      }

      // Vérifier les contraintes d'unicité
      const duplicatePermissions = await prisma.$queryRaw<{resource: string, action: string, count: bigint}[]>`
        SELECT resource, action, COUNT(*) as count
        FROM permissions
        GROUP BY resource, action
        HAVING COUNT(*) > 1
      `;

      if (duplicatePermissions.length > 0) {
        this.addResult(false, 'PERMISSIONS DUPLIQUÉES détectées', {
          duplicates: duplicatePermissions.map(dp => ({
            resource: dp.resource,
            action: dp.action,
            count: Number(dp.count)
          }))
        }, 'critical');
      }

      // Vérifier l'intégrité référentielle avec des requêtes SQL brutes
      const orphanRolePermissions = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count
        FROM role_permissions rp
        LEFT JOIN roles r ON rp."roleId" = r.id
        LEFT JOIN permissions p ON rp."permissionId" = p.id
        WHERE r.id IS NULL OR p.id IS NULL
      `;

      const orphanRoleCount = Number(orphanRolePermissions[0]?.count || 0);
      if (orphanRoleCount > 0) {
        this.addResult(false, `INTÉGRITÉ ROMPUE: ${orphanRoleCount} associations rôle-permission orphelines`, null, 'critical');
      }

      const orphanUserPermissions = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count
        FROM user_permissions up
        LEFT JOIN utilisateurs u ON up."userId" = u.id
        LEFT JOIN permissions p ON up."permissionId" = p.id
        WHERE u.id IS NULL OR p.id IS NULL
      `;

      const orphanUserCount = Number(orphanUserPermissions[0]?.count || 0);
      if (orphanUserCount > 0) {
        this.addResult(false, `INTÉGRITÉ ROMPUE: ${orphanUserCount} permissions utilisateur orphelines`, null, 'critical');
      }

      // Vérifier les utilisateurs sans rôle - CORRECTION FINALE
      const usersWithoutRole = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count FROM utilisateurs WHERE "roleId" IS NULL
      `;
      const usersWithoutRoleCount = Number(usersWithoutRole[0]?.count || 0);

      if (usersWithoutRoleCount > 0) {
        this.addResult(false, `SECURITÉ: ${usersWithoutRoleCount} utilisateurs sans rôle assigné`, null, 'critical');
      }

      this.addResult(true, `Intégrité de base validée: ${tables.permissions} permissions, ${tables.roles} rôles, ${tables.users} utilisateurs, ${tables.rolePermissions} liens rôle-permission, ${tables.userPermissions} permissions directes`);

    } catch (error) {
      this.addResult(false, 'ERREUR FATALE lors de la validation de l\'intégrité', error, 'critical');
    }
  }
  private async validatePermissionDefinitions(): Promise<void> {
    console.log('📝 Validation des définitions de permissions...');

    try {
      const allPermissions = await prisma.permission.findMany({
        orderBy: [{ resource: 'asc' }, { action: 'asc' }]
      });

      // Vérifier les permissions critiques manquantes
      const criticalPermissions = [
        { resource: 'admin', action: 'read' },
        { resource: 'admin', action: 'create' },
        { resource: 'admin', action: 'update' },
        { resource: 'admin', action: 'delete' },
        { resource: 'utilisateurs', action: 'read' },
        { resource: 'utilisateurs', action: 'create' },
        { resource: 'utilisateurs', action: 'update' },
        { resource: 'utilisateurs', action: 'delete' },
        { resource: 'clients', action: 'read' },
        { resource: 'clients', action: 'create' },
        { resource: 'clients', action: 'update' },
        { resource: 'clients', action: 'delete' }
      ];

      const missingCritical: string[] = [];
      for (const critical of criticalPermissions) {
        const exists = allPermissions.some(p => 
          p.resource === critical.resource && p.action === critical.action
        );
        if (!exists) {
          missingCritical.push(`${critical.resource}:${critical.action}`);
        }
      }

      if (missingCritical.length > 0) {
        this.addResult(false, `PERMISSIONS CRITIQUES MANQUANTES: ${missingCritical.length} permissions essentielles absentes`, {
          missing: missingCritical
        }, 'critical');
      }

      // Vérifier la cohérence des actions par ressource
      const permissionsByResource = allPermissions.reduce((acc, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        acc[permission.resource]!.push(permission.action);
        return acc;
      }, {} as Record<string, string[]>);

      const inconsistentResources: string[] = [];
      for (const [resource, actions] of Object.entries(permissionsByResource)) {
        const hasRead = actions.includes('read');
        const hasUpdate = actions.includes('update');
        const hasDelete = actions.includes('delete');

        if (hasDelete && (!hasRead || !hasUpdate)) {
          inconsistentResources.push(`${resource} (delete sans read/update)`);
        }
        if (hasUpdate && !hasRead) {
          inconsistentResources.push(`${resource} (update sans read)`);
        }
      }

      if (inconsistentResources.length > 0) {
        this.addResult(false, `INCOHÉRENCES DANS LES PERMISSIONS: ${inconsistentResources.length} ressources avec des actions incohérentes`, {
          inconsistencies: inconsistentResources
        }, 'warning');
      }

      this.addResult(true, `Définitions de permissions validées: ${allPermissions.length} permissions définies, ${Object.keys(permissionsByResource).length} ressources distinctes`);

    } catch (error) {
      this.addResult(false, 'Erreur lors de la validation des définitions de permissions', error, 'critical');
    }
  }

  private async validateRolePermissions(): Promise<void> {
    console.log('👥 Validation approfondie des permissions de rôles...');

    try {
      const roles = await prisma.role.findMany({
        include: {
          rolePermissions: {
            include: { permission: true }
          },
          _count: {
            select: {
              utilisateurs: true,
              rolePermissions: true
            }
          }
        },
        orderBy: { libelle: 'asc' }
      });

      let totalRolePermissions = 0;
      const rolesWithoutPermissions: string[] = [];
      const systemRolesWithoutPermissions: string[] = [];

      for (const role of roles) {
        totalRolePermissions += role._count.rolePermissions;

        // Vérifier les rôles sans permissions
        if (role._count.rolePermissions === 0) {
          rolesWithoutPermissions.push(role.libelle);
          if (role.isSystem) {
            systemRolesWithoutPermissions.push(role.libelle);
          }
        }

        // Vérifier les permissions des rôles administrateurs
        if (role.libelle.toLowerCase().includes('admin')) {
          const adminPermissions = role.rolePermissions.map(rp => 
            `${rp.permission.resource}:${rp.permission.action}`
          );

          const requiredAdminPermissions = [
            'admin:read', 'admin:create', 'admin:update', 'admin:delete',
            'utilisateurs:read', 'utilisateurs:create', 'utilisateurs:update'
          ];

          const missingAdminPermissions = requiredAdminPermissions.filter(
            perm => !adminPermissions.includes(perm)
          );

          if (missingAdminPermissions.length > 0) {
            this.addResult(false, `ROLE ADMIN INCOMPLET: "${role.libelle}" manque ${missingAdminPermissions.length} permissions critiques`, {
              role: role.libelle,
              missing: missingAdminPermissions,
              existing: adminPermissions
            }, 'critical');
          }
        }
      }

      if (rolesWithoutPermissions.length > 0) {
        this.addResult(false, `ROLES SANS PERMISSIONS: ${rolesWithoutPermissions.length} rôles sans aucune permission`, {
          roles: rolesWithoutPermissions
        }, 'warning');
      }

      if (systemRolesWithoutPermissions.length > 0) {
        this.addResult(false, `ROLES SYSTÈME SANS PERMISSIONS: ${systemRolesWithoutPermissions.length} rôles système sans permissions`, {
          systemRoles: systemRolesWithoutPermissions
        }, 'critical');
      }

      this.addResult(true, `Permissions de rôles validées: ${roles.length} rôles, ${totalRolePermissions} permissions attribuées, moyenne de ${(totalRolePermissions / Math.max(roles.length, 1)).toFixed(1)} permissions par rôle`);

    } catch (error) {
      this.addResult(false, 'Erreur lors de la validation des permissions de rôles', error, 'critical');
    }
  }

  private async validateUserPermissions(): Promise<void> {
    console.log('👤 Validation approfondie des permissions utilisateurs...');

    try {
      const users = await prisma.utilisateur.findMany({
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true }
              }
            }
          },
          userPermissions: {
            include: { permission: true }
          }
        },
        where: {
          status: 'active'
        },
        take: 100 // Limiter pour les performances
      });

      let usersWithDirectPermissions = 0;
      let totalDirectPermissions = 0;
      const usersWithoutRole: string[] = [];
      const permissionConflicts: any[] = [];

      for (const user of users) {
        // Vérifier les utilisateurs sans rôle
        if (!user.role) {
          usersWithoutRole.push(user.email);
          continue;
        }

        // Compter les permissions directes
        if (user.userPermissions.length > 0) {
          usersWithDirectPermissions++;
          totalDirectPermissions += user.userPermissions.length;
        }

        // Détecter les conflits de permissions
        for (const userPerm of user.userPermissions) {
          const roleHasPermission = await prisma.rolePermission.findFirst({
            where: {
              roleId: user.roleId,
              permissionId: userPerm.permissionId
            }
          });

          if (roleHasPermission && userPerm.granted === false) {
            permissionConflicts.push({
              user: user.email,
              permission: `${userPerm.permission.resource}:${userPerm.permission.action}`,
              conflict: 'Permission refusée alors que le rôle l\'accorde'
            });
          }
        }

        // Tester les permissions critiques
        const criticalPermissionsToTest = [
          { resource: 'clients', action: 'read' },
          { resource: 'utilisateurs', action: 'read' },
          { resource: 'admin', action: 'read' }
        ];

        for (const testPerm of criticalPermissionsToTest) {
          try {
            await permissionService.hasPermission(user.id, testPerm.resource, testPerm.action);
          } catch (error) {
            this.addResult(false, `ERREUR de test de permission pour ${user.email}: ${testPerm.resource}:${testPerm.action}`, error, 'warning');
          }
        }
      }

      if (usersWithoutRole.length > 0) {
        this.addResult(false, `UTILISATEURS ACTIFS SANS RÔLE: ${usersWithoutRole.length} utilisateurs actifs sans rôle assigné`, {
          users: usersWithoutRole
        }, 'critical');
      }

      if (permissionConflicts.length > 0) {
        this.addResult(false, `CONFLITS DE PERMISSIONS: ${permissionConflicts.length} conflits détectés`, {
          conflicts: permissionConflicts.slice(0, 10) // Limiter l'affichage
        }, 'warning');
      }

      const percentageWithDirectPermissions = users.length > 0 
        ? ((usersWithDirectPermissions / users.length) * 100).toFixed(1)
        : '0.0';

      this.addResult(true, `Permissions utilisateurs validées: ${users.length} utilisateurs actifs, ${usersWithDirectPermissions} avec permissions directes (${percentageWithDirectPermissions}%), ${totalDirectPermissions} permissions directes au total`);

    } catch (error) {
      this.addResult(false, 'Erreur lors de la validation des permissions utilisateurs', error, 'critical');
    }
  }

  private async validatePermissionLogic(): Promise<void> {
    console.log('🧠 Validation approfondie de la logique des permissions...');

    try {
      // Créer un utilisateur de test temporaire
      const testRole = await prisma.role.create({
        data: {
          libelle: 'Test_Role_Validation',
          description: 'Rôle temporaire pour validation'
        }
      });

      const testUser = await prisma.utilisateur.create({
        data: {
          nom: 'Test',
          prenom: 'Validation',
          email: 'test.validation@example.com',
          motDePasse: 'temp',
          roleId: testRole.id
        }
      });

      // Test 1: Utilisateur sans permissions
      const hasNoPermission = await permissionService.hasPermission(testUser.id, 'clients', 'read');
      if (hasNoPermission) {
        this.addResult(false, 'Utilisateur sans permissions a accès à clients:read');
      } else {
        this.addResult(true, 'Logique de refus par défaut fonctionne');
      }

      // Test 2: Ajouter permission via rôle
      const readPermission = await prisma.permission.findFirst({
        where: { resource: 'clients', action: 'read' }
      });

      if (readPermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: testRole.id,
            permissionId: readPermission.id
          }
        });

        // Invalider le cache
        permissionService.invalidateUser(testUser.id);

        const hasRolePermission = await permissionService.hasPermission(testUser.id, 'clients', 'read');
        if (!hasRolePermission) {
          this.addResult(false, 'Permission de rôle non reconnue');
        } else {
          this.addResult(true, 'Logique de permission de rôle fonctionne');
        }

        // Test 3: Override avec permission directe
        await permissionService.revokePermission(testUser.id, 'clients', 'read', testUser.id);

        const hasDirectDenial = await permissionService.hasPermission(testUser.id, 'clients', 'read');
        if (hasDirectDenial) {
          this.addResult(false, 'Permission directe refusée non respectée');
        } else {
          this.addResult(true, 'Logique d\'override par permission directe fonctionne');
        }

        // Test 4: Accorder permission directe
        await permissionService.grantPermission(testUser.id, 'clients', 'create', testUser.id);

        const hasDirectGrant = await permissionService.hasPermission(testUser.id, 'clients', 'create');
        if (!hasDirectGrant) {
          this.addResult(false, 'Permission directe accordée non reconnue');
        } else {
          this.addResult(true, 'Logique d\'octroi de permission directe fonctionne');
        }
      }

      // Nettoyer les données de test
      await prisma.userPermission.deleteMany({ where: { userId: testUser.id } });
      await prisma.rolePermission.deleteMany({ where: { roleId: testRole.id } });
      await prisma.utilisateur.delete({ where: { id: testUser.id } });
      await prisma.role.delete({ where: { id: testRole.id } });

    } catch (error) {
      this.addResult(false, 'Erreur lors de la validation de la logique', error, 'critical');
    }
  }

  private async validatePerformance(): Promise<void> {
    console.log('⚡ Validation des performances...');

    try {
      const users = await prisma.utilisateur.findMany({ take: 5 });
      
      if (users.length === 0) {
        this.addResult(false, 'Aucun utilisateur pour tester les performances');
        return;
      }

      // Test de performance du cache
      const startTime = Date.now();
      
      for (const user of users) {
        // Premier appel - charge depuis la DB
        await permissionService.getUserPermissions(user.id);
        
        // Deuxième appel - devrait utiliser le cache
        await permissionService.getUserPermissions(user.id);
        
        // Test de vérification de permission
        await permissionService.hasPermission(user.id, 'clients', 'read');
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgPerUser = duration / users.length;

      if (avgPerUser > 100) {
        this.addResult(false, `Performance dégradée: ${avgPerUser.toFixed(2)}ms par utilisateur`);
      } else {
        this.addResult(true, `Performance acceptable: ${avgPerUser.toFixed(2)}ms par utilisateur`);
      }

      // Test de performance des requêtes complexes
      const complexQueryStart = Date.now();
      
      await prisma.utilisateur.findMany({
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true }
              }
            }
          },
          userPermissions: {
            include: { permission: true }
          }
        }
      });

      const complexQueryEnd = Date.now();
      const complexDuration = complexQueryEnd - complexQueryStart;

      if (complexDuration > 1000) {
        this.addResult(false, `Requête complexe lente: ${complexDuration}ms`);
      } else {
        this.addResult(true, `Requête complexe performante: ${complexDuration}ms`);
      }

    } catch (error) {
      this.addResult(false, 'Erreur lors de la validation des performances', error, 'critical');
    }
  }

  private async validateSecurityConstraints(): Promise<void> {
    console.log('🔒 Validation des contraintes de sécurité...');

    try {
      // Vérifier les rôles système modifiables - CORRECTION
      const systemRoles = await prisma.role.findMany({
        where: {
          isSystem: true
        },
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      });

      // Filtrer manuellement les rôles modifiés
      const modifiedSystemRoles = systemRoles.filter(role => 
        role.updatedAt.getTime() !== role.createdAt.getTime() || role.rolePermissions.length > 0
      );

      if (modifiedSystemRoles.length > 0) {
        this.addResult(false, `ROLES SYSTÈME MODIFIÉS: ${modifiedSystemRoles.length} rôles système ont été modifiés`, {
          roles: modifiedSystemRoles.map(r => ({
            role: r.libelle,
            permissions: r.rolePermissions.length,
            lastUpdate: r.updatedAt
          }))
        }, 'warning');
      }

      // Vérifier les permissions avec des noms suspects
      const suspiciousPermissions = await prisma.permission.findMany({
        where: {
          OR: [
            { resource: { contains: 'admin' } },
            { resource: { contains: 'system' } },
            { resource: { contains: 'root' } },
            { action: { contains: 'all' } },
            { action: { contains: 'super' } }
          ]
        }
      });

      if (suspiciousPermissions.length > 0) {
        this.addResult(true, `Permissions sensibles détectées: ${suspiciousPermissions.length} permissions avec des noms sensibles`, {
          permissions: suspiciousPermissions.map(p => ({
            resource: p.resource,
            action: p.action,
            description: p.description
          }))
        }, 'info');
      }

      this.addResult(true, 'Contraintes de sécurité validées: audit des permissions sensibles complété');

    } catch (error) {
      this.addResult(false, 'Erreur lors de la validation des contraintes de sécurité', error, 'critical');
    }
  }

  private addResult(success: boolean, message: string, details?: any, severity: 'critical' | 'warning' | 'info' = 'info'): void {
    const result: ValidationResult = { success, message, details, severity };
    this.results.push(result);
    
    const icon = success ? '✅' : severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    const color = success ? '\x1b[32m' : severity === 'critical' ? '\x1b[31m' : severity === 'warning' ? '\x1b[33m' : '\x1b[36m';
    const reset = '\x1b[0m';
    
    console.log(`   ${color}${icon} ${message}${reset}`);
    if (details && !success) {
      console.log(`      Détails:`, JSON.stringify(details, null, 2));
    }
  }

  private printSummary(): void {
    const duration = Date.now() - this.validationStartTime;
    const successCount = this.results.filter(r => r.success).length;
    const failureCount = this.results.filter(r => !r.success).length;
    const criticalIssues = this.results.filter(r => !r.success && r.severity === 'critical').length;
    const warnings = this.results.filter(r => !r.success && r.severity === 'warning').length;
    
    console.log('\n📋 RÉSUMÉ DÉTAILLÉ DE LA VALIDATION:');
    console.log(`   ⏱️  Durée: ${duration}ms`);
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Échecs: ${failureCount}`);
    console.log(`   🚨 Problèmes critiques: ${criticalIssues}`);
    console.log(`   ⚠️  Avertissements: ${warnings}`);
    console.log(`   📊 Total des vérifications: ${this.results.length}`);
    
    // Afficher les problèmes par ordre de sévérité
    const criticalProblems = this.results.filter(r => !r.success && r.severity === 'critical');
    const warningProblems = this.results.filter(r => !r.success && r.severity === 'warning');

    if (criticalProblems.length > 0) {
      console.log('\n🚨 PROBLÈMES CRITIQUES À CORRIGER IMMÉDIATEMENT:');
      criticalProblems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem.message}`);
      });
    }

    if (warningProblems.length > 0) {
      console.log('\n⚠️  AVERTISSEMENTS À EXAMINER:');
      warningProblems.forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem.message}`);
      });
    }
    
    if (failureCount === 0) {
      console.log('\n🎉 SYSTÈME DE PERMISSIONS ENTIÈREMENT VALIDÉ !');
      console.log('   ✅ Prêt pour la production');
    } else if (criticalIssues === 0) {
      console.log('\n⚠️  VALIDATION AVEC RÉSERVES');
      console.log('   ⚠️  Corriger les avertissements avant la production');
    } else {
      console.log('\n🚨 VALIDATION ÉCHOUÉE');
      console.log('   ❌ NE PAS DÉPLOYER EN PRODUCTION');
      console.log('   🔧 Corriger les problèmes critiques immédiatement');
    }

    console.log(`\n💡 Recommandation: ${this.getRecommendation()}`);
  }

  private getRecommendation(): string {
    const criticalCount = this.results.filter(r => !r.success && r.severity === 'critical').length;
    const warningCount = this.results.filter(r => !r.success && r.severity === 'warning').length;

    if (criticalCount > 0) {
      return 'ARRÊTER le déploiement et corriger les problèmes critiques immédiatement';
    } else if (warningCount > 5) {
      return 'Examiner attentivement les avertissements avant le déploiement';
    } else if (warningCount > 0) {
      return 'Déploiement possible mais examiner les avertissements';
    } else {
      return 'Déploiement approuvé - système sécurisé et validé';
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const validator = new PermissionValidator();
  
  validator.validateSystem()
    .then(results => {
      const hasCriticalIssues = results.some(r => !r.success && r.severity === 'critical');
      process.exit(hasCriticalIssues ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ ERREUR FATALE lors de la validation:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { PermissionValidator };
export default PermissionValidator;