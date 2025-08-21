import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const missingPermissions = [
  { resource: 'rapports', action: 'read', description: 'Lire les rapports' },
  { resource: 'rapports', action: 'create', description: 'Créer des rapports' },
  { resource: 'rapports', action: 'update', description: 'Modifier les rapports' },
  { resource: 'rapports', action: 'delete', description: 'Supprimer des rapports' },
  { resource: 'rapports', action: 'validate', description: 'Valider les rapports' }
];

async function addMissingPermissions() {
  try {
    console.log('🌱 Ajout des permissions manquantes...');

    for (const perm of missingPermissions) {
      await prisma.permission.upsert({
        where: { 
          resource_action: { 
            resource: perm.resource, 
            action: perm.action 
          } 
        },
        update: perm,
        create: perm,
      });
      console.log(`✅ ${perm.resource}:${perm.action}`);
    }

    console.log('🎉 Permissions manquantes ajoutées avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l ajout des permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  addMissingPermissions();
}

export { addMissingPermissions };