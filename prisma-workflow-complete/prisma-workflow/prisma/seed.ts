import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyage des données existantes (optionnel)
  console.log('🧹 Nettoyage des données existantes...');
  
  // Création des rôles
  console.log('👥 Création des rôles...');
  const roleAdmin = await prisma.role.upsert({
    where: { libelle: 'Administrateur' },
    update: {},
    create: {
      libelle: 'Administrateur',
    },
  });

  const roleTechnicien = await prisma.role.upsert({
    where: { libelle: 'Technicien' },
    update: {},
    create: {
      libelle: 'Technicien',
    },
  });

  const roleManager = await prisma.role.upsert({
    where: { libelle: 'Manager' },
    update: {},
    create: {
      libelle: 'Manager',
    },
  });

  const roleClient = await prisma.role.upsert({
    where: { libelle: 'Client' },
    update: {},
    create: {
      libelle: 'Client',
    },
  });

  // Création des spécialités
  console.log('🔧 Création des spécialités...');
  const specialiteElectricite = await prisma.specialite.upsert({
    where: { libelle: 'Électricité' },
    update: {},
    create: {
      libelle: 'Électricité',
      description: 'Installation et maintenance électrique',
    },
  });

  const specialitePlomberie = await prisma.specialite.upsert({
    where: { libelle: 'Plomberie' },
    update: {},
    create: {
      libelle: 'Plomberie',
      description: 'Installation et réparation de systèmes de plomberie',
    },
  });

  const specialiteChauffage = await prisma.specialite.upsert({
    where: { libelle: 'Chauffage' },
    update: {},
    create: {
      libelle: 'Chauffage',
      description: 'Installation et maintenance de systèmes de chauffage',
    },
  });

  const specialiteClimatisation = await prisma.specialite.upsert({
    where: { libelle: 'Climatisation' },
    update: {},
    create: {
      libelle: 'Climatisation',
      description: 'Installation et maintenance de systèmes de climatisation',
    },
  });

  // Création des types de paiement
  console.log('💳 Création des types de paiement...');
  const typePaiementComptant = await prisma.typePaiement.upsert({
    where: { libelle: 'Comptant' },
    update: {},
    create: {
      libelle: 'Comptant',
      description: 'Paiement immédiat',
      delaiPaiement: 0,
      tauxRemise: 2.5,
    },
  });

  const typePaiement30j = await prisma.typePaiement.upsert({
    where: { libelle: '30 jours' },
    update: {},
    create: {
      libelle: '30 jours',
      description: 'Paiement à 30 jours',
      delaiPaiement: 30,
      tauxRemise: 0,
    },
  });

  const typePaiement60j = await prisma.typePaiement.upsert({
    where: { libelle: '60 jours' },
    update: {},
    create: {
      libelle: '60 jours',
      description: 'Paiement à 60 jours',
      delaiPaiement: 60,
      tauxRemise: 0,
    },
  });

  // Création des utilisateurs
  console.log('👤 Création des utilisateurs...');
  const adminUser = await prisma.utilisateur.upsert({
    where: { email: 'admin@intervention.com' },
    update: {},
    create: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'admin@intervention.com',
      motDePasse: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.O', // password: admin123
      phone: '+33123456789',
      theme: 'light',
      displayName: 'Jean Dupont',
      address: '123 Rue de la Paix',
      state: 'Île-de-France',
      country: 'France',
      designation: 'Administrateur Système',
      balance: 0,
      emailStatus: 'verified',
      kycStatus: 'approved',
      status: 'active',
      roleId: roleAdmin.id,
    },
  });

  const managerUser = await prisma.utilisateur.upsert({
    where: { email: 'manager@intervention.com' },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Sophie',
      email: 'manager@intervention.com',
      motDePasse: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.O', // password: admin123
      phone: '+33123456790',
      theme: 'light',
      displayName: 'Sophie Martin',
      address: '456 Avenue des Champs',
      state: 'Île-de-France',
      country: 'France',
      designation: 'Manager Opérations',
      balance: 0,
      emailStatus: 'verified',
      kycStatus: 'approved',
      status: 'active',
      roleId: roleManager.id,
    },
  });

  const technicienUser1 = await prisma.utilisateur.upsert({
    where: { email: 'technicien1@intervention.com' },
    update: {},
    create: {
      nom: 'Moreau',
      prenom: 'Pierre',
      email: 'technicien1@intervention.com',
      motDePasse: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.O', // password: admin123
      phone: '+33123456791',
      theme: 'dark',
      displayName: 'Pierre Moreau',
      address: '789 Rue de la République',
      state: 'Île-de-France',
      country: 'France',
      designation: 'Technicien Senior',
      balance: 0,
      emailStatus: 'verified',
      kycStatus: 'approved',
      status: 'active',
      roleId: roleTechnicien.id,
    },
  });

  const technicienUser2 = await prisma.utilisateur.upsert({
    where: { email: 'technicien2@intervention.com' },
    update: {},
    create: {
      nom: 'Bernard',
      prenom: 'Marie',
      email: 'technicien2@intervention.com',
      motDePasse: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.O', // password: admin123
      phone: '+33123456792',
      theme: 'light',
      displayName: 'Marie Bernard',
      address: '321 Boulevard Saint-Germain',
      state: 'Île-de-France',
      country: 'France',
      designation: 'Technicienne',
      balance: 0,
      emailStatus: 'verified',
      kycStatus: 'approved',
      status: 'active',
      roleId: roleTechnicien.id,
    },
  });

  // Création des techniciens
  console.log('🔧 Création des techniciens...');
  const technicien1 = await prisma.technicien.upsert({
    where: { utilisateurId: technicienUser1.id },
    update: {},
    create: {
      nom: 'Moreau',
      prenom: 'Pierre',
      contact: '+33123456791',
      specialiteId: specialiteElectricite.id,
      utilisateurId: technicienUser1.id,
    },
  });

  const technicien2 = await prisma.technicien.upsert({
    where: { utilisateurId: technicienUser2.id },
    update: {},
    create: {
      nom: 'Bernard',
      prenom: 'Marie',
      contact: '+33123456792',
      specialiteId: specialitePlomberie.id,
      utilisateurId: technicienUser2.id,
    },
  });

  // Création des clients
  console.log('🏢 Création des clients...');
  const client1 = await prisma.client.upsert({
    where: { email: 'contact@entrepriseabc.com' },
    update: {},
    create: {
      nom: 'Entreprise ABC',
      email: 'contact@entrepriseabc.com',
      telephone: '+33123456800',
      entreprise: 'ABC Solutions',
      typeDeCart: 'Premium',
      numeroDeCarte: 'ABC001',
      typePaiementId: typePaiement30j.id,
      statut: 'active',
      localisation: 'Paris, France',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { email: 'info@societedef.com' },
    update: {},
    create: {
      nom: 'Société DEF',
      email: 'info@societedef.com',
      telephone: '+33123456801',
      entreprise: 'DEF Industries',
      typeDeCart: 'Standard',
      numeroDeCarte: 'DEF002',
      typePaiementId: typePaiementComptant.id,
      statut: 'active',
      localisation: 'Lyon, France',
    },
  });

  // Création des matériels
  console.log('🛠️ Création des matériels...');
  const materiel1 = await prisma.materiel.upsert({
    where: { reference: 'ELEC001' },
    update: {},
    create: {
      reference: 'ELEC001',
      designation: 'Multimètre numérique',
      description: 'Multimètre professionnel pour mesures électriques',
      quantiteTotale: 10,
      quantiteDisponible: 8,
      seuilAlerte: 3,
      emplacement: 'Magasin A - Étagère 1',
      categorie: 'Instrumentation',
      prixUnitaire: 150.00,
      fournisseur: 'Fluke Corporation',
      garantie: '2 ans',
      statut: 'actif',
    },
  });

  const materiel2 = await prisma.materiel.upsert({
    where: { reference: 'PLOMB001' },
    update: {},
    create: {
      reference: 'PLOMB001',
      designation: 'Clé à molette 300mm',
      description: 'Clé à molette professionnelle 300mm',
      quantiteTotale: 15,
      quantiteDisponible: 12,
      seuilAlerte: 5,
      emplacement: 'Magasin B - Étagère 2',
      categorie: 'Outillage',
      prixUnitaire: 45.00,
      fournisseur: 'Stanley Tools',
      garantie: '1 an',
      statut: 'actif',
    },
  });

  // Création des missions
  console.log('📋 Création des missions...');
  const mission1 = await prisma.mission.upsert({
    where: { numIntervention: 'INT-2024-001' },
    update: {},
    create: {
      numIntervention: 'INT-2024-001',
      natureIntervention: 'Maintenance préventive',
      objectifDuContrat: 'Vérification et maintenance du système électrique',
      description: 'Contrôle annuel du tableau électrique et des installations',
      priorite: 'normale',
      statut: 'planifiee',
      dateSortieFicheIntervention: new Date('2024-08-15'),
      clientId: client1.id,
    },
  });

  const mission2 = await prisma.mission.upsert({
    where: { numIntervention: 'INT-2024-002' },
    update: {},
    create: {
      numIntervention: 'INT-2024-002',
      natureIntervention: 'Dépannage urgent',
      objectifDuContrat: 'Réparation fuite d\'eau',
      description: 'Intervention urgente pour fuite dans les canalisations',
      priorite: 'urgente',
      statut: 'en_cours',
      dateSortieFicheIntervention: new Date('2024-08-10'),
      clientId: client2.id,
    },
  });

  // Création des interventions
  console.log('⚡ Création des interventions...');
  const intervention1 = await prisma.intervention.create({
    data: {
      dateHeureDebut: new Date('2024-08-15T09:00:00'),
      dateHeureFin: new Date('2024-08-15T12:00:00'),
      duree: 180, // 3 heures en minutes
      missionId: mission1.numIntervention,
    },
  });

  const intervention2 = await prisma.intervention.create({
    data: {
      dateHeureDebut: new Date('2024-08-10T14:00:00'),
      dateHeureFin: null, // Intervention en cours
      duree: null,
      missionId: mission2.numIntervention,
    },
  });

  // Association techniciens-interventions
  console.log('👥 Association techniciens-interventions...');
  await prisma.technicienIntervention.create({
    data: {
      technicienId: technicien1.id,
      interventionId: intervention1.id,
      role: 'responsable',
      commentaire: 'Technicien principal pour cette intervention',
    },
  });

  await prisma.technicienIntervention.create({
    data: {
      technicienId: technicien2.id,
      interventionId: intervention2.id,
      role: 'responsable',
      commentaire: 'Intervention urgente plomberie',
    },
  });

  // Création des devis
  console.log('💰 Création des devis...');
  const devis1 = await prisma.devis.create({
    data: {
      numero: 'DEV-2024-001',
      clientId: client1.id,
      missionId: mission1.numIntervention,
      titre: 'Maintenance électrique annuelle',
      description: 'Devis pour la maintenance préventive du système électrique',
      montantHT: 800.00,
      tauxTVA: 20,
      montantTTC: 960.00,
      statut: 'valide',
      dateValidite: new Date('2024-09-15'),
      dateValidationDG: new Date('2024-08-05'),
      validePar: managerUser.id,
      lignes: {
        create: [
          {
            designation: 'Contrôle tableau électrique',
            quantite: 1,
            prixUnitaire: 300.00,
            montantHT: 300.00,
            ordre: 1,
          },
          {
            designation: 'Vérification installations',
            quantite: 1,
            prixUnitaire: 250.00,
            montantHT: 250.00,
            ordre: 2,
          },
          {
            designation: 'Rapport de conformité',
            quantite: 1,
            prixUnitaire: 250.00,
            montantHT: 250.00,
            ordre: 3,
          },
        ],
      },
    },
  });

  // Création des rapports de mission
  console.log('📄 Création des rapports de mission...');
  await prisma.rapportMission.create({
    data: {
      titre: 'Rapport maintenance électrique',
      contenu: 'Maintenance effectuée avec succès. Tous les contrôles sont conformes aux normes en vigueur.',
      interventionId: intervention1.id,
      technicienId: technicien1.id,
      missionId: mission1.numIntervention,
      statut: 'valide',
      dateValidation: new Date('2024-08-15T15:00:00'),
      commentaire: 'Intervention réalisée dans les temps',
    },
  });

  // Création des sorties de matériel
  console.log('📦 Création des sorties de matériel...');
  await prisma.sortieMateriel.create({
    data: {
      materielId: materiel1.id,
      interventionId: intervention1.id,
      technicienId: technicien1.id,
      quantite: 1,
      motif: 'Mesures électriques',
      retourne: true,
      dateRetour: new Date('2024-08-15T16:00:00'),
      quantiteRetour: 1,
      commentaire: 'Matériel retourné en bon état',
    },
  });

  await prisma.sortieMateriel.create({
    data: {
      materielId: materiel2.id,
      interventionId: intervention2.id,
      technicienId: technicien2.id,
      quantite: 1,
      motif: 'Réparation plomberie',
      retourne: false,
      commentaire: 'Matériel en cours d\'utilisation',
    },
  });

  // Mise à jour des quantités disponibles
  await prisma.materiel.update({
    where: { id: materiel1.id },
    data: { quantiteDisponible: 8 },
  });

  await prisma.materiel.update({
    where: { id: materiel2.id },
    data: { quantiteDisponible: 11 },
  });

  console.log('✅ Seeding terminé avec succès !');
  console.log(`
📊 Données créées :
- ${await prisma.role.count()} rôles
- ${await prisma.specialite.count()} spécialités
- ${await prisma.typePaiement.count()} types de paiement
- ${await prisma.utilisateur.count()} utilisateurs
- ${await prisma.technicien.count()} techniciens
- ${await prisma.client.count()} clients
- ${await prisma.materiel.count()} matériels
- ${await prisma.mission.count()} missions
- ${await prisma.intervention.count()} interventions
- ${await prisma.devis.count()} devis
- ${await prisma.rapportMission.count()} rapports de mission
- ${await prisma.sortieMateriel.count()} sorties de matériel
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

