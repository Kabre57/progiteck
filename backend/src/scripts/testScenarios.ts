import { PrismaClient } from '@prisma/client';
import { permissionService } from '../services/permissionService';

const prisma = new PrismaClient();

interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  test: () => Promise<boolean>;
  cleanup: () => Promise<void>;
}

class PermissionScenarioTester {
  private scenarios: TestScenario[] = [];
  private testData: any = {};

  constructor() {
    this.setupScenarios();
  }

  private setupScenarios(): void {
    this.scenarios = [
      {
        name: 'Administrateur - Accès complet',
        description: 'Un administrateur doit avoir accès à toutes les fonctionnalités',
        setup: () => this.setupAdminScenario(),
        test: () => this.testAdminAccess(),
        cleanup: () => this.cleanupTestData()
      },
      {
        name: 'Commercial - Accès limité aux ventes',
        description: 'Un commercial doit avoir accès aux clients, devis, factures mais pas à l\'administration',
        setup: () => this.setupCommercialScenario(),
        test: () => this.testCommercialAccess(),
        cleanup: () => this.cleanupTestData()
      },
      {
        name: 'Technicien - Accès technique uniquement',
        description: 'Un technicien doit avoir accès aux interventions et rapports mais pas aux données commerciales',
        setup: () => this.setupTechnicienScenario(),
        test: () => this.testTechnicienAccess(),
        cleanup: () => this.cleanupTestData()
      },
      {
        name: 'Permission directe - Override du rôle',
        description: 'Une permission directe doit pouvoir overrider les permissions du rôle',
        setup: () => this.setupOverrideScenario(),
        test: () => this.testPermissionOverride(),
        cleanup: () => this.cleanupTestData()
      },
      {
        name: 'Utilisateur sans rôle',
        description: 'Un utilisateur sans rôle valide ne doit avoir aucun accès',
        setup: () => this.setupNoRoleScenario(),
        test: () => this.testNoRoleAccess(),
        cleanup: () => this.cleanupTestData()
      },
      {
        name: 'Permissions contextuelles',
        description: 'Un utilisateur doit pouvoir modifier ses propres données même sans permission globale',
        setup: () => this.setupContextualScenario(),
        test: () => this.testContextualPermissions(),
        cleanup: () => this.cleanupTestData()
      }
    ];
  }

  async runAllScenarios(): Promise<void> {
    console.log('🎭 Début des tests de scénarios utilisateur...\n');

    let passedCount = 0;
    let failedCount = 0;

    for (const scenario of this.scenarios) {
      console.log(`📋 Test: ${scenario.name}`);
      console.log(`   Description: ${scenario.description}`);

      try {
        // Setup
        await scenario.setup();
        
        // Test
        const result = await scenario.test();
        
        if (result) {
          console.log('   ✅ SUCCÈS\n');
          passedCount++;
        } else {
          console.log('   ❌ ÉCHEC\n');
          failedCount++;
        }

        // Cleanup
        await scenario.cleanup();

      } catch (error) {
        console.log(`   💥 ERREUR: ${error}\n`);
        failedCount++;
        
        try {
          await scenario.cleanup();
        } catch (cleanupError) {
          console.log(`   ⚠️  Erreur de nettoyage: ${cleanupError}`);
        }
      }
    }

    console.log('📊 Résumé des tests de scénarios:');
    console.log(`   ✅ Réussis: ${passedCount}`);
    console.log(`   ❌ Échoués: ${failedCount}`);
    console.log(`   📈 Taux de réussite: ${((passedCount / this.scenarios.length) * 100).toFixed(1)}%`);

    if (failedCount === 0) {
      console.log('\n🎉 Tous les scénarios ont réussi !');
    } else {
      console.log('\n⚠️  Certains scénarios ont échoué. Vérifiez l\'implémentation.');
    }
  }

  private async setupAdminScenario(): Promise<void> {
    // Créer un rôle administrateur avec toutes les permissions
    const adminRole = await prisma.role.create({
      data: {
        libelle: 'Test_Admin',
        description: 'Administrateur de test',
        isSystem: false
      }
    });

    const adminUser = await prisma.utilisateur.create({
      data: {
        nom: 'Admin',
        prenom: 'Test',
        email: 'admin.test@example.com',
        motDePasse: 'test',
        roleId: adminRole.id
      }
    });

    // Donner toutes les permissions admin
    const permissions = await prisma.permission.findMany({
      where: {
        OR: [
          { resource: 'admin' },
          { resource: 'utilisateurs' },
          { resource: 'clients' },
          { resource: 'devis' }
        ]
      }
    });

    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }

    this.testData = { adminRole, adminUser };
  }

  private async testAdminAccess(): Promise<boolean> {
    const { adminUser } = this.testData;

    // Tester l'accès à différentes ressources critiques
    const tests = [
      { resource: 'admin', action: 'read' },
      { resource: 'admin', action: 'create' },
      { resource: 'utilisateurs', action: 'create' },
      { resource: 'utilisateurs', action: 'update' },
      { resource: 'clients', action: 'delete' },
      { resource: 'devis', action: 'validate' }
    ];

    for (const test of tests) {
      const hasPermission = await permissionService.hasPermission(
        adminUser.id,
        test.resource,
        test.action
      );

      if (!hasPermission) {
        console.log(`     ❌ Admin n'a pas ${test.resource}:${test.action}`);
        return false;
      }
    }

    console.log('     ✅ Admin a tous les accès requis');
    return true;
  }

  private async setupCommercialScenario(): Promise<void> {
    const commercialRole = await prisma.role.create({
      data: {
        libelle: 'Test_Commercial',
        description: 'Commercial de test'
      }
    });

    const commercialUser = await prisma.utilisateur.create({
      data: {
        nom: 'Commercial',
        prenom: 'Test',
        email: 'commercial.test@example.com',
        motDePasse: 'test',
        roleId: commercialRole.id
      }
    });

    // Permissions commerciales uniquement
    const commercialPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { resource: 'clients' },
          { resource: 'devis' },
          { resource: 'factures' },
          { resource: 'dashboard', action: 'read' }
        ],
        action: { not: 'delete' } // Pas de suppression
      }
    });

    for (const permission of commercialPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: commercialRole.id,
          permissionId: permission.id
        }
      });
    }

    this.testData = { commercialRole, commercialUser };
  }

  private async testCommercialAccess(): Promise<boolean> {
    const { commercialUser } = this.testData;

    // Tests positifs - devrait avoir accès
    const allowedTests = [
      { resource: 'clients', action: 'read' },
      { resource: 'clients', action: 'create' },
      { resource: 'devis', action: 'create' },
      { resource: 'factures', action: 'read' },
      { resource: 'dashboard', action: 'read' }
    ];

    for (const test of allowedTests) {
      const hasPermission = await permissionService.hasPermission(
        commercialUser.id,
        test.resource,
        test.action
      );

      if (!hasPermission) {
        console.log(`     ❌ Commercial devrait avoir ${test.resource}:${test.action}`);
        return false;
      }
    }

    // Tests négatifs - ne devrait pas avoir accès
    const deniedTests = [
      { resource: 'admin', action: 'read' },
      { resource: 'utilisateurs', action: 'create' },
      { resource: 'clients', action: 'delete' },
      { resource: 'interventions', action: 'create' }
    ];

    for (const test of deniedTests) {
      const hasPermission = await permissionService.hasPermission(
        commercialUser.id,
        test.resource,
        test.action
      );

      if (hasPermission) {
        console.log(`     ❌ Commercial ne devrait pas avoir ${test.resource}:${test.action}`);
        return false;
      }
    }

    console.log('     ✅ Commercial a les bons accès (autorisés et refusés)');
    return true;
  }

  private async setupTechnicienScenario(): Promise<void> {
    const technicienRole = await prisma.role.create({
      data: {
        libelle: 'Test_Technicien',
        description: 'Technicien de test'
      }
    });

    const technicienUser = await prisma.utilisateur.create({
      data: {
        nom: 'Technicien',
        prenom: 'Test',
        email: 'technicien.test@example.com',
        motDePasse: 'test',
        roleId: technicienRole.id
      }
    });

    // Permissions techniques uniquement
    const techPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { resource: 'interventions' },
          { resource: 'rapports' },
          { resource: 'materiels', action: 'read' },
          { resource: 'missions', action: 'read' },
          { resource: 'techniciens', action: 'read' }
        ]
      }
    });

    for (const permission of techPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: technicienRole.id,
          permissionId: permission.id
        }
      });
    }

    this.testData = { technicienRole, technicienUser };
  }

  private async testTechnicienAccess(): Promise<boolean> {
    const { technicienUser } = this.testData;

    // Tests positifs
    const allowedTests = [
      { resource: 'interventions', action: 'read' },
      { resource: 'interventions', action: 'update' },
      { resource: 'rapports', action: 'create' },
      { resource: 'materiels', action: 'read' },
      { resource: 'missions', action: 'read' }
    ];

    for (const test of allowedTests) {
      const hasPermission = await permissionService.hasPermission(
        technicienUser.id,
        test.resource,
        test.action
      );

      if (!hasPermission) {
        console.log(`     ❌ Technicien devrait avoir ${test.resource}:${test.action}`);
        return false;
      }
    }

    // Tests négatifs
    const deniedTests = [
      { resource: 'clients', action: 'create' },
      { resource: 'devis', action: 'read' },
      { resource: 'factures', action: 'read' },
      { resource: 'admin', action: 'read' },
      { resource: 'utilisateurs', action: 'read' }
    ];

    for (const test of deniedTests) {
      const hasPermission = await permissionService.hasPermission(
        technicienUser.id,
        test.resource,
        test.action
      );

      if (hasPermission) {
        console.log(`     ❌ Technicien ne devrait pas avoir ${test.resource}:${test.action}`);
        return false;
      }
    }

    console.log('     ✅ Technicien a les bons accès techniques');
    return true;
  }

  private async setupOverrideScenario(): Promise<void> {
    const testRole = await prisma.role.create({
      data: {
        libelle: 'Test_Override',
        description: 'Rôle pour test override'
      }
    });

    const testUser = await prisma.utilisateur.create({
      data: {
        nom: 'Override',
        prenom: 'Test',
        email: 'override.test@example.com',
        motDePasse: 'test',
        roleId: testRole.id
      }
    });

    // Donner permission clients:read via le rôle
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
    }

    this.testData = { testRole, testUser, readPermission };
  }

  private async testPermissionOverride(): Promise<boolean> {
    const { testUser } = this.testData;

    // Vérifier que l'utilisateur a la permission via son rôle
    let hasPermission = await permissionService.hasPermission(testUser.id, 'clients', 'read');
    if (!hasPermission) {
      console.log('     ❌ Permission de rôle non reconnue');
      return false;
    }

    // Refuser la permission directement
    await permissionService.revokePermission(testUser.id, 'clients', 'read', testUser.id);

    // Vérifier que la permission est maintenant refusée
    hasPermission = await permissionService.hasPermission(testUser.id, 'clients', 'read');
    if (hasPermission) {
      console.log('     ❌ Override de refus non effectif');
      return false;
    }

    // Accorder une nouvelle permission directement
    await permissionService.grantPermission(testUser.id, 'clients', 'create', testUser.id);

    // Vérifier que la nouvelle permission est accordée
    hasPermission = await permissionService.hasPermission(testUser.id, 'clients', 'create');
    if (!hasPermission) {
      console.log('     ❌ Permission directe accordée non reconnue');
      return false;
    }

    console.log('     ✅ Override de permissions fonctionne correctement');
    return true;
  }

  private async setupNoRoleScenario(): Promise<void> {
    // Créer un rôle vide
    const emptyRole = await prisma.role.create({
      data: {
        libelle: 'Test_Empty',
        description: 'Rôle vide pour test'
      }
    });

    const noAccessUser = await prisma.utilisateur.create({
      data: {
        nom: 'NoAccess',
        prenom: 'Test',
        email: 'noaccess.test@example.com',
        motDePasse: 'test',
        roleId: emptyRole.id
      }
    });

    this.testData = { emptyRole, noAccessUser };
  }

  private async testNoRoleAccess(): Promise<boolean> {
    const { noAccessUser } = this.testData;

    // Tester plusieurs permissions - toutes devraient être refusées
    const tests = [
      { resource: 'clients', action: 'read' },
      { resource: 'admin', action: 'read' },
      { resource: 'interventions', action: 'read' },
      { resource: 'dashboard', action: 'read' }
    ];

    for (const test of tests) {
      const hasPermission = await permissionService.hasPermission(
        noAccessUser.id,
        test.resource,
        test.action
      );

      if (hasPermission) {
        console.log(`     ❌ Utilisateur sans rôle a accès à ${test.resource}:${test.action}`);
        return false;
      }
    }

    console.log('     ✅ Utilisateur sans permissions correctement bloqué');
    return true;
  }

  private async setupContextualScenario(): Promise<void> {
    const limitedRole = await prisma.role.create({
      data: {
        libelle: 'Test_Limited',
        description: 'Rôle limité pour test contextuel'
      }
    });

    const limitedUser = await prisma.utilisateur.create({
      data: {
        nom: 'Limited',
        prenom: 'Test',
        email: 'limited.test@example.com',
        motDePasse: 'test',
        roleId: limitedRole.id
      }
    });

    // Donner seulement lecture générale
    const readPermission = await prisma.permission.findFirst({
      where: { resource: 'rapports', action: 'read' }
    });

    if (readPermission) {
      await prisma.rolePermission.create({
        data: {
          roleId: limitedRole.id,
          permissionId: readPermission.id
        }
      });
    }

    this.testData = { limitedRole, limitedUser };
  }

  private async testContextualPermissions(): Promise<boolean> {
    const { limitedUser } = this.testData;

    // L'utilisateur ne devrait pas avoir de permission globale de modification
    let hasGlobalUpdate = await permissionService.hasPermission(limitedUser.id, 'rapports', 'update');
    if (hasGlobalUpdate) {
      console.log('     ❌ Utilisateur a permission globale inattendue');
      return false;
    }

    // Mais il devrait pouvoir modifier ses propres rapports (logique contextuelle)
    // Cette logique serait implémentée dans le middleware requireOwnershipOrPermission
    const canModifyOwn = await permissionService.hasOwnershipPermission(
      limitedUser.id,
      'rapports',
      'update',
      limitedUser.id // Il est propriétaire
    );

    if (!canModifyOwn) {
      console.log('     ❌ Utilisateur ne peut pas modifier ses propres données');
      return false;
    }

    // Mais pas celles des autres
    const canModifyOthers = await permissionService.hasOwnershipPermission(
      limitedUser.id,
      'rapports',
      'update',
      999 // Autre utilisateur
    );

    if (canModifyOthers) {
      console.log('     ❌ Utilisateur peut modifier les données d\'autrui');
      return false;
    }

    console.log('     ✅ Permissions contextuelles fonctionnent correctement');
    return true;
  }

  private async cleanupTestData(): Promise<void> {
    // Nettoyer toutes les données de test créées
    if (this.testData.testUser) {
      await prisma.userPermission.deleteMany({
        where: { userId: this.testData.testUser.id }
      });
    }

    if (this.testData.testRole || this.testData.adminRole || this.testData.commercialRole || 
        this.testData.technicienRole || this.testData.emptyRole || this.testData.limitedRole) {
      const roleIds = [
        this.testData.testRole?.id,
        this.testData.adminRole?.id,
        this.testData.commercialRole?.id,
        this.testData.technicienRole?.id,
        this.testData.emptyRole?.id,
        this.testData.limitedRole?.id
      ].filter(Boolean);

      await prisma.rolePermission.deleteMany({
        where: { roleId: { in: roleIds } }
      });
    }

    // Supprimer les utilisateurs de test
    await prisma.utilisateur.deleteMany({
      where: {
        email: {
          endsWith: '.test@example.com'
        }
      }
    });

    // Supprimer les rôles de test
    await prisma.role.deleteMany({
      where: {
        libelle: {
          startsWith: 'Test_'
        }
      }
    });

    // Vider le cache
    permissionService.clearCache();

    this.testData = {};
  }
}

async function main() {
  const tester = new PermissionScenarioTester();
  
  try {
    await tester.runAllScenarios();
  } catch (error) {
    console.error('❌ Erreur fatale lors des tests de scénarios:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { PermissionScenarioTester };
export default main;

