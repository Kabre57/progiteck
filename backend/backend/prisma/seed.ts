import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Nettoyer les données existantes (optionnel)
  console.log('🧹 Nettoyage des données existantes...');
  
  // Créer les rôles
  console.log('👥 Création des rôles...');
  const adminRole = await prisma.role.upsert({
    where: { libelle: 'admin' },
    update: {},
    create: {
      libelle: 'admin'
    }
  });

  const managerRole = await prisma.role.upsert({
    where: { libelle: 'manager' },
    update: {},
    create: {
      libelle: 'manager'
    }
  });

  const technicienRole = await prisma.role.upsert({
    where: { libelle: 'technicien' },
    update: {},
    create: {
      libelle: 'technicien'
    }
  });

  // Créer les utilisateurs
  console.log('👤 Création des utilisateurs...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.utilisateur.upsert({
    where: { email: 'admin@progitek.com' },
    update: {},
    create: {
      nom: 'Admin',
      prenom: 'System',
      email: 'admin@progitek.com',
      motDePasse: hashedPassword,
      phone: '+33123456789',
      displayName: 'Administrateur',
      status: 'active',
      roleId: adminRole.id
    }
  });

  const managerUser = await prisma.utilisateur.upsert({
    where: { email: 'manager@progitek.com' },
    update: {},
    create: {
      nom: 'Manager',
      prenom: 'Test',
      email: 'manager@progitek.com',
      motDePasse: hashedPassword,
      phone: '+33123456790',
      displayName: 'Manager de test',
      status: 'active',
      roleId: managerRole.id
    }
  });

  // Créer les spécialités
  console.log('🔧 Création des spécialités...');
  const specialiteElectricite = await prisma.specialite.upsert({
    where: { libelle: 'Électricité' },
    update: {},
    create: {
      libelle: 'Électricité',
      description: 'Installation et maintenance électrique'
    }
  });

  const specialitePlomberie = await prisma.specialite.upsert({
    where: { libelle: 'Plomberie' },
    update: {},
    create: {
      libelle: 'Plomberie',
      description: 'Installation et réparation de plomberie'
    }
  });

  const specialiteChauffage = await prisma.specialite.upsert({
    where: { libelle: 'Chauffage' },
    update: {},
    create: {
      libelle: 'Chauffage',
      description: 'Installation et maintenance de systèmes de chauffage'
    }
  });

  // Créer les techniciens
  console.log('👷 Création des techniciens...');
  const technicienUser1 = await prisma.utilisateur.upsert({
    where: { email: 'jean.dupont@progitek.com' },
    update: {},
    create: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@progitek.com',
      motDePasse: hashedPassword,
      phone: '+33123456791',
      displayName: 'Jean Dupont',
      status: 'active',
      roleId: technicienRole.id
    }
  });

  const technicien1 = await prisma.technicien.upsert({
    where: { utilisateurId: technicienUser1.id },
    update: {},
    create: {
      nom: 'Dupont',
      prenom: 'Jean',
      contact: '+33123456791',
      specialiteId: specialiteElectricite.id,
      utilisateurId: technicienUser1.id
    }
  });

  const technicienUser2 = await prisma.utilisateur.upsert({
    where: { email: 'marie.martin@progitek.com' },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Marie',
      email: 'marie.martin@progitek.com',
      motDePasse: hashedPassword,
      phone: '+33123456792',
      displayName: 'Marie Martin',
      status: 'active',
      roleId: technicienRole.id
    }
  });

  const technicien2 = await prisma.technicien.upsert({
    where: { utilisateurId: technicienUser2.id },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Marie',
      contact: '+33123456792',
      specialiteId: specialitePlomberie.id,
      utilisateurId: technicienUser2.id
    }
  });

  // Créer les types de paiement
  console.log('💳 Création des types de paiement...');
  const typePaiementComptant = await prisma.typePaiement.upsert({
    where: { libelle: 'Comptant' },
    update: {},
    create: {
      libelle: 'Comptant',
      description: 'Paiement immédiat',
      delaiPaiement: 0,
      tauxRemise: 2.0,
      actif: true
    }
  });

  const typePaiement30j = await prisma.typePaiement.upsert({
    where: { libelle: '30 jours' },
    update: {},
    create: {
      libelle: '30 jours',
      description: 'Paiement à 30 jours',
      delaiPaiement: 30,
      tauxRemise: 0.0,
      actif: true
    }
  });

  // Créer les clients
  console.log('🏢 Création des clients...');
  const client1 = await prisma.client.upsert({
    where: { email: 'contact@entreprise-a.com' },
    update: {},
    create: {
      nom: 'Entreprise A',
      email: 'contact@entreprise-a.com',
      telephone: '+33123456800',
      entreprise: 'Entreprise A SARL',
      typeDeCart: 'Professionnel',
      localisation: 'Paris, France',
      typePaiementId: typePaiement30j.id
    }
  });

  const client2 = await prisma.client.upsert({
    where: { email: 'info@societe-b.fr' },
    update: {},
    create: {
      nom: 'Société B',
      email: 'info@societe-b.fr',
      telephone: '+33123456801',
      entreprise: 'Société B SAS',
      typeDeCart: 'Professionnel',
      localisation: 'Lyon, France',
      typePaiementId: typePaiementComptant.id
    }
  });

  // Créer les matériels
  console.log('📦 Création des matériels...');
  const materiel1 = await prisma.materiel.upsert({
    where: { reference: 'ELEC-001' },
    update: {},
    create: {
      reference: 'ELEC-001',
      designation: 'Disjoncteur 16A',
      quantiteTotale: 50,
      quantiteDisponible: 45,
      seuilAlerte: 10,
      categorie: 'Équipement',
      prixUnitaire: 25.50,
      description: 'Disjoncteur différentiel 16A'
    }
  });

  const materiel2 = await prisma.materiel.upsert({
    where: { reference: 'PLOMB-001' },
    update: {},
    create: {
      reference: 'PLOMB-001',
      designation: 'Tube PVC Ø32mm',
      quantiteTotale: 100,
      quantiteDisponible: 85,
      seuilAlerte: 20,
      categorie: 'Pièce',
      prixUnitaire: 12.30,
      description: 'Tube PVC diamètre 32mm, longueur 2m'
    }
  });

  const materiel3 = await prisma.materiel.upsert({
    where: { reference: 'OUTIL-001' },
    update: {},
    create: {
      reference: 'OUTIL-001',
      designation: 'Multimètre digital',
      quantiteTotale: 10,
      quantiteDisponible: 8,
      seuilAlerte: 2,
      categorie: 'Outillage',
      prixUnitaire: 89.90,
      description: 'Multimètre digital professionnel'
    }
  });

  // Créer les missions
  console.log('📋 Création des missions...');
  const mission1 = await prisma.mission.upsert({
    where: { numIntervention: 'INT-2025-001' },
    update: {},
    create: {
      numIntervention: 'INT-2025-001',
      natureIntervention: 'Installation électrique',
      objectifDuContrat: 'Installation complète du tableau électrique',
      description: 'Installation d\'un nouveau tableau électrique avec mise aux normes',
      priorite: 'normale',
      statut: 'planifiee',
      dateSortieFicheIntervention: new Date(),
      clientId: client1.id
    }
  });

  const mission2 = await prisma.mission.upsert({
    where: { numIntervention: 'INT-2025-002' },
    update: {},
    create: {
      numIntervention: 'INT-2025-002',
      natureIntervention: 'Réparation plomberie',
      objectifDuContrat: 'Réparation fuite canalisation',
      description: 'Réparation d\'une fuite sur la canalisation principale',
      priorite: 'haute',
      statut: 'planifiee',
      dateSortieFicheIntervention: new Date(),
      clientId: client2.id
    }
  });

  console.log('✅ Seeding terminé avec succès !');
  console.log('');
  console.log('📊 Données créées :');
  console.log(`- ${3} rôles`);
  console.log(`- ${4} utilisateurs`);
  console.log(`- ${2} techniciens`);
  console.log(`- ${3} spécialités`);
  console.log(`- ${2} types de paiement`);
  console.log(`- ${2} clients`);
  console.log(`- ${3} matériels`);
  console.log(`- ${2} missions`);
  console.log('');
  console.log('🔑 Comptes de test :');
  console.log('- Admin: admin@progitek.com / password123');
  console.log('- Manager: manager@progitek.com / password123');
  console.log('- Technicien 1: jean.dupont@progitek.com / password123');
  console.log('- Technicien 2: marie.martin@progitek.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

