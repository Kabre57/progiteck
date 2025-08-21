import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const rolePermissions = {
  COMMERCIAL: [
    'clients:read', 'clients:create', 'clients:update',
    'devis:read', 'devis:create', 'devis:update',
    'missions:read'
  ],
  MANAGER: [
    'clients:read', 'clients:create', 'clients:update', 'clients:delete',
    'devis:read', 'devis:create', 'devis:update', 'devis:delete', 'devis:validate',
    'missions:read', 'missions:create', 'missions:update', 'missions:delete',
    'utilisateurs:read'
  ],
  TECHNICIEN: [
    'missions:read', 
    'rapports:read', 'rapports:create', 'rapports:update'
  ]
};

async function seedRolePermissions() {
  try {
    console.log('🌱 Début de l attribution des permissions aux rôles...');

    // D'abord, récupérer toutes les permissions
    const allPermissions = await prisma.permission.findMany();
    
    for (const [roleName, permissionStrings] of Object.entries(rolePermissions)) {
      const role = await prisma.role.findFirst({ 
        where: { libelle: roleName } 
      });

      if (role) {
        console.log(`🔧 Attribution des permissions au rôle ${roleName}...`);
        
        for (const permString of permissionStrings) {
          const [resource, action] = permString.split(':');
          
          // Trouver la permission dans la liste déjà chargée
          const permission = allPermissions.find(p => 
            p.resource === resource && p.action === action
          );

          if (permission) {
            await prisma.rolePermission.upsert({
              where: { 
                roleId_permissionId: { 
                  roleId: role.id, 
                  permissionId: permission.id 
                } 
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
            console.log(`   ✅ ${resource}:${action}`);
          } else {
            console.log(`   ❌ Permission non trouvée: ${resource}:${action}`);
          }
        }
        console.log(`✅ Toutes les permissions assignées au rôle ${roleName}`);
      } else {
        console.log(`❌ Rôle non trouvé: ${roleName}`);
      }
    }

    console.log('🎉 Attribution des permissions terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l attribution des permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedRolePermissions();
}

export { seedRolePermissions };