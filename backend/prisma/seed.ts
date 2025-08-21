import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding - Base de données complète...');

  // --- 1. Rôles ---
  const adminRole = await prisma.role.upsert({ where: { libelle: 'ADMIN' }, update: {}, create: { libelle: 'ADMIN' } });
  const managerRole = await prisma.role.upsert({ where: { libelle: 'MANAGER' }, update: {}, create: { libelle: 'MANAGER' } });
  const commercialRole = await prisma.role.upsert({ where: { libelle: 'COMMERCIAL' }, update: {}, create: { libelle: 'COMMERCIAL' } });
  const technicienRole = await prisma.role.upsert({ where: { libelle: 'TECHNICIEN' }, update: {}, create: { libelle: 'TECHNICIEN' } });
  console.log('✅ Rôles créés');

  // --- 2. Utilisateurs ---
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.utilisateur.upsert({
    where: { email: 'beibro09@gmail.com' },
    update: {},
    create: {
      nom: 'BEIBRO',
      prenom: 'Super Admin',
      email: 'beibro09@gmail.com',
      motDePasse: hashedPassword,
      phone: '0102030405',
      displayName: 'Super Administrateur',
      roleId: adminRole.id,
    },
  }); 
  const hashedPassword1 = await bcrypt.hash('PDG2025++@', 12);
  const adminUser1 = await prisma.utilisateur.upsert({
    where: { email: 'pdg@parabellumgroups.com' },
    update: {},
    create: {
      nom: 'PDG',
      prenom: 'Administrateur',
      email: 'pdg@parabellumgroups.com',
      motDePasse: hashedPassword1,
      phone: '0100000000',
      displayName: 'PDG parabellumgroups',
      roleId: adminRole.id,
    },
  });

  const hashedPassword2 = await bcrypt.hash('Kwt0101006545++@', 12);
  const adminUser2 = await prisma.utilisateur.upsert({
    where: { email: 'btheogeoffroy5@gmail.com' },
    update: {},
    create: {
      nom: 'KABRE',
      prenom: 'Weinkouni theodore',
      email: 'btheogeoffroy5@gmail.com',
      motDePasse: hashedPassword2,
      phone: '0757390157',
      displayName: 'KABRE W. Theodore',
      roleId: technicienRole.id,
    },
  }); 


  console.log('✅ Super Administrateur créé (beibro09@gmail.com / Admin123!)');
  console.log('✅ Administrateur créé (pdg@parabellumgroups.com / PDG2025++@)');

  // --- 3. Spécialités ---
  const securiteSpec = await prisma.specialite.upsert({ where: { libelle: 'Sécurité Informatique' }, update: {}, create: { libelle: 'Sécurité Informatique', description: 'Audit, pentesting, solutions de sécurité.' } });
  const devWebSpec = await prisma.specialite.upsert({ where: { libelle: 'Développement Web' }, update: {}, create: { libelle: 'Développement Web', description: 'Création de sites et applications web.' } });
  console.log('✅ Spécialités créées');


  // --- 5. Types de Paiement ---
  const comptantType = await prisma.typePaiement.upsert({ where: { libelle: 'Comptant' }, update: {}, create: { libelle: 'Comptant', delaiPaiement: 0 } });
  console.log('✅ Types de paiement créés');

  // --- 6. Clients ---
  const orangeClient = await prisma.client.upsert({
    where: { email: 'contact@orange.ci' },
    update: {},
    create: {
      nom: 'Orange Côte d\'Ivoire',
      email: 'contact@orange.ci',
      telephone: '2721234567',
      entreprise: 'Orange CI',
      typePaiementId: comptantType.id,
      localisation: 'Marcory, Abidjan',
    },
  });
  console.log('✅ Clients créés');

  // --- 7. Missions & Interventions ---
  const missionAudit = await prisma.mission.upsert({
    where: { numIntervention: 'MSN-2025-0001' },
    update: {},
    create: {
      numIntervention: 'MSN-2025-0001',
      natureIntervention: 'Audit de sécurité annuel',
      objectifDuContrat: 'Vérifier la conformité et la sécurité du SI.',
      description: 'Audit complet des infrastructures réseau et serveurs.',
      priorite: 'haute',
      statut: 'en_cours',
      dateSortieFicheIntervention: new Date(),
      clientId: orangeClient.id,
    },
  });
  console.log('✅ Missions créées');

  console.log('🎉 Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
