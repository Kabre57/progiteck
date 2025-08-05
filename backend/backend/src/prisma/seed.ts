import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding - Entreprise Informatique Ivoirienne...');

  // Créer les rôles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { libelle: 'admin' },
      update: {},
      create: { libelle: 'admin' }
    }),
    prisma.role.upsert({
      where: { libelle: 'manager' },
      update: {},
      create: { libelle: 'manager' }
    }),
    prisma.role.upsert({
      where: { libelle: 'commercial' },
      update: {},
      create: { libelle: 'commercial' }
    }),
    prisma.role.upsert({
      where: { libelle: 'technicien' },
      update: {},
      create: { libelle: 'technicien' }
    })
  ]);

  console.log('✅ Rôles créés');

  // Créer les spécialités informatiques
  const specialites = await Promise.all([
    prisma.specialite.upsert({
      where: { libelle: 'Sécurité Informatique' },
      update: {},
      create: {
        libelle: 'Sécurité Informatique',
        description: 'Audit sécurité, pentesting, mise en place de solutions de sécurité'
      }
    }),
    prisma.specialite.upsert({
      where: { libelle: 'Développement Web' },
      update: {},
      create: {
        libelle: 'Développement Web',
        description: 'Création de sites web, applications web, e-commerce'
      }
    }),
    prisma.specialite.upsert({
      where: { libelle: 'DevOps' },
      update: {},
      create: {
        libelle: 'DevOps',
        description: 'CI/CD, containerisation, infrastructure cloud, monitoring'
      }
    }),
    prisma.specialite.upsert({
      where: { libelle: 'Maintenance Informatique' },
      update: {},
      create: {
        libelle: 'Maintenance Informatique',
        description: 'Maintenance serveurs, réseaux, postes de travail'
      }
    }),
    prisma.specialite.upsert({
      where: { libelle: 'Développement Mobile' },
      update: {},
      create: {
        libelle: 'Développement Mobile',
        description: 'Applications iOS, Android, React Native, Flutter'
      }
    })
  ]);

  console.log('✅ Spécialités informatiques créées');

  // Créer les types de paiement
  const typesPaiement = await Promise.all([
    prisma.typePaiement.upsert({
      where: { libelle: 'Comptant' },
      update: {},
      create: {
        libelle: 'Comptant',
        description: 'Paiement immédiat à la livraison',
        delaiPaiement: 0,
        tauxRemise: 3,
        actif: true
      }
    }),
    prisma.typePaiement.upsert({
      where: { libelle: '30 jours' },
      update: {},
      create: {
        libelle: '30 jours',
        description: 'Paiement à 30 jours fin de mois',
        delaiPaiement: 30,
        tauxRemise: 0,
        actif: true
      }
    }),
    prisma.typePaiement.upsert({
      where: { libelle: '60 jours' },
      update: {},
      create: {
        libelle: '60 jours',
        description: 'Paiement à 60 jours pour clients Premium',
        delaiPaiement: 60,
        tauxRemise: 0,
        actif: true
      }
    }),
    prisma.typePaiement.upsert({
      where: { libelle: 'Échelonné' },
      update: {},
      create: {
        libelle: 'Échelonné',
        description: 'Paiement en plusieurs tranches',
        delaiPaiement: 90,
        tauxRemise: 0,
        actif: true
      }
    })
  ]);

  console.log('✅ Types de paiement créés');

  // Créer les utilisateurs avec noms ivoiriens
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const users = await Promise.all([
    // DG - Amoikon
    prisma.utilisateur.upsert({
      where: { email: 'amoikon@progitek.ci' },
      update: {},
      create: {
        nom: 'Amoikon',
        prenom: 'Directeur Général',
        email: 'amoikon@progitek.ci',
        motDePasse: hashedPassword,
        phone: '+225 07 12 34 56 78',
        displayName: 'Amoikon DG',
        roleId: roles[0].id // admin
      }
    }),
    // Manager - Beibro Yves
    prisma.utilisateur.upsert({
      where: { email: 'beibro.yves@progitek.ci' },
      update: {},
      create: {
        nom: 'Beibro',
        prenom: 'Yves',
        email: 'beibro.yves@progitek.ci',
        motDePasse: await bcrypt.hash('manager123', 10),
        phone: '+225 05 23 45 67 89',
        displayName: 'Beibro Yves',
        roleId: roles[1].id // manager
      }
    }),
    // Commercial - Konan Yane
    prisma.utilisateur.upsert({
      where: { email: 'konan.yane@progitek.ci' },
      update: {},
      create: {
        nom: 'Konan',
        prenom: 'Yane',
        email: 'konan.yane@progitek.ci',
        motDePasse: await bcrypt.hash('commercial123', 10),
        phone: '+225 01 34 56 78 90',
        displayName: 'Konan Yane',
        roleId: roles[2].id // commercial
      }
    }),
    // Technicien - Kabre Theodore
    prisma.utilisateur.upsert({
      where: { email: 'kabre.theodore@progitek.ci' },
      update: {},
      create: {
        nom: 'Kabre',
        prenom: 'Theodore',
        email: 'kabre.theodore@progitek.ci',
        motDePasse: await bcrypt.hash('tech123', 10),
        phone: '+225 07 45 67 89 01',
        displayName: 'Kabre Theodore',
        roleId: roles[3].id // technicien
      }
    }),
    // Technicien - Anguy Evra
    prisma.utilisateur.upsert({
      where: { email: 'anguy.evra@progitek.ci' },
      update: {},
      create: {
        nom: 'Anguy',
        prenom: 'Evra',
        email: 'anguy.evra@progitek.ci',
        motDePasse: await bcrypt.hash('tech123', 10),
        phone: '+225 05 56 67 78 89',
        displayName: 'Anguy Evra',
        roleId: roles[3].id // technicien
      }
    }),
    // Technicien - Ouattara Siaka
    prisma.utilisateur.upsert({
      where: { email: 'ouattara.siaka@progitek.ci' },
      update: {},
      create: {
        nom: 'Ouattara',
        prenom: 'Siaka',
        email: 'ouattara.siaka@progitek.ci',
        motDePasse: await bcrypt.hash('tech123', 10),
        phone: '+225 01 67 78 89 90',
        displayName: 'Ouattara Siaka',
        roleId: roles[3].id // technicien
      }
    })
  ]);

  console.log('✅ Utilisateurs ivoiriens créés');

  // Créer les clients (entreprises ivoiriennes)
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { email: 'contact@banqueatlantique.ci' },
      update: {},
      create: {
        nom: 'Banque Atlantique Côte d\'Ivoire',
        email: 'contact@banqueatlantique.ci',
        telephone: '+225 27 20 30 40 50',
        entreprise: 'Banque Atlantique CI',
        typeDeCart: 'VIP',
        typePaiementId: typesPaiement[2].id, // 60 jours
        localisation: 'Plateau, Abidjan, Côte d\'Ivoire'
      }
    }),
    prisma.client.upsert({
      where: { email: 'it@orange.ci' },
      update: {},
      create: {
        nom: 'Orange Côte d\'Ivoire',
        email: 'it@orange.ci',
        telephone: '+225 07 08 09 10 11',
        entreprise: 'Orange CI',
        typeDeCart: 'Premium',
        typePaiementId: typesPaiement[1].id, // 30 jours
        localisation: 'Marcory, Abidjan, Côte d\'Ivoire'
      }
    }),
    prisma.client.upsert({
      where: { email: 'tech@mtn.ci' },
      update: {},
      create: {
        nom: 'MTN Côte d\'Ivoire',
        email: 'tech@mtn.ci',
        telephone: '+225 05 06 07 08 09',
        entreprise: 'MTN CI',
        typeDeCart: 'Premium',
        typePaiementId: typesPaiement[1].id, // 30 jours
        localisation: 'Cocody, Abidjan, Côte d\'Ivoire'
      }
    }),
    prisma.client.upsert({
      where: { email: 'contact@ministere-numerique.gouv.ci' },
      update: {},
      create: {
        nom: 'Ministère du Numérique',
        email: 'contact@ministere-numerique.gouv.ci',
        telephone: '+225 27 21 22 23 24',
        entreprise: 'Ministère du Numérique et de la Digitalisation',
        typeDeCart: 'VIP',
        typePaiementId: typesPaiement[3].id, // Échelonné
        localisation: 'Plateau, Abidjan, Côte d\'Ivoire'
      }
    }),
    prisma.client.upsert({
      where: { email: 'info@startup-ci.com' },
      update: {},
      create: {
        nom: 'InnovTech CI',
        email: 'info@startup-ci.com',
        telephone: '+225 01 02 03 04 05',
        entreprise: 'InnovTech Côte d\'Ivoire',
        typeDeCart: 'Standard',
        typePaiementId: typesPaiement[0].id, // Comptant
        localisation: 'Yopougon, Abidjan, Côte d\'Ivoire'
      }
    })
  ]);

  console.log('✅ Clients entreprises ivoiriennes créés');

  // Créer les techniciens
  const techniciens = await Promise.all([
    prisma.technicien.upsert({
      where: { id: 1 },
      update: {},
      create: {
        nom: 'Kabre',
        prenom: 'Theodore',
        contact: '+225 07 45 67 89 01',
        specialiteId: specialites[0].id, // Sécurité Informatique
        utilisateurId: users[3].id
      }
    }),
    prisma.technicien.upsert({
      where: { id: 2 },
      update: {},
      create: {
        nom: 'Anguy',
        prenom: 'Evra',
        contact: '+225 05 56 67 78 89',
        specialiteId: specialites[1].id // Développement Web
      }
    }),
    prisma.technicien.upsert({
      where: { id: 3 },
      update: {},
      create: {
        nom: 'Ouattara',
        prenom: 'Siaka',
        contact: '+225 01 67 78 89 90',
        specialiteId: specialites[2].id // DevOps
      }
    }),
    prisma.technicien.upsert({
      where: { id: 4 },
      update: {},
      create: {
        nom: 'Kone',
        prenom: 'Mamadou',
        contact: '+225 07 78 89 90 01',
        specialiteId: specialites[3].id // Maintenance Informatique
      }
    }),
    prisma.technicien.upsert({
      where: { id: 5 },
      update: {},
      create: {
        nom: 'Traore',
        prenom: 'Aminata',
        contact: '+225 05 89 90 01 12',
        specialiteId: specialites[4].id // Développement Mobile
      }
    })
  ]);

  console.log('✅ Techniciens spécialisés créés');

  // Créer des missions d'exemple
  const missions = await Promise.all([
    prisma.mission.upsert({
      where: { numIntervention: 'INT-2025-0001' },
      update: {},
      create: {
        numIntervention: 'INT-2025-0001',
        natureIntervention: 'Audit de sécurité informatique complet',
        objectifDuContrat: 'Évaluation complète de la sécurité du système d\'information bancaire et recommandations',
        description: 'Audit de sécurité incluant tests de pénétration, analyse des vulnérabilités et mise en conformité RGPD',
        priorite: 'urgente',
        statut: 'en_cours',
        dateSortieFicheIntervention: new Date('2025-07-25T08:00:00Z'),
        clientId: clients[0].id // Banque Atlantique
      }
    }),
    prisma.mission.upsert({
      where: { numIntervention: 'INT-2025-0002' },
      update: {},
      create: {
        numIntervention: 'INT-2025-0002',
        natureIntervention: 'Développement application mobile Orange Money',
        objectifDuContrat: 'Création d\'une application mobile sécurisée pour les transactions Orange Money',
        description: 'Application React Native avec authentification biométrique et intégration API bancaire',
        priorite: 'normale',
        statut: 'planifiee',
        dateSortieFicheIntervention: new Date('2025-07-28T09:00:00Z'),
        clientId: clients[1].id // Orange CI
      }
    }),
    prisma.mission.upsert({
      where: { numIntervention: 'INT-2025-0003' },
      update: {},
      create: {
        numIntervention: 'INT-2025-0003',
        natureIntervention: 'Migration infrastructure cloud MTN',
        objectifDuContrat: 'Migration complète de l\'infrastructure MTN vers le cloud AWS avec mise en place DevOps',
        description: 'Migration cloud, containerisation Docker, CI/CD Jenkins, monitoring Prometheus',
        priorite: 'normale',
        statut: 'planifiee',
        dateSortieFicheIntervention: new Date('2025-08-01T08:00:00Z'),
        clientId: clients[2].id // MTN CI
      }
    }),
    prisma.mission.upsert({
      where: { numIntervention: 'INT-2025-0004' },
      update: {},
      create: {
        numIntervention: 'INT-2025-0004',
        natureIntervention: 'Portail numérique gouvernemental',
        objectifDuContrat: 'Développement du portail numérique pour les services publics en ligne',
        description: 'Portail web sécurisé avec authentification citoyenne et intégration services publics',
        priorite: 'urgente',
        statut: 'en_cours',
        dateSortieFicheIntervention: new Date('2025-07-30T10:00:00Z'),
        clientId: clients[3].id // Ministère du Numérique
      }
    }),
    prisma.mission.upsert({
      where: { numIntervention: 'INT-2025-0005' },
      update: {},
      create: {
        numIntervention: 'INT-2025-0005',
        natureIntervention: 'Site e-commerce et maintenance',
        objectifDuContrat: 'Création site e-commerce pour startup et contrat de maintenance annuel',
        description: 'Site e-commerce Shopify personnalisé avec paiement mobile money et maintenance préventive',
        priorite: 'normale',
        statut: 'terminee',
        dateSortieFicheIntervention: new Date('2025-07-20T14:00:00Z'),
        clientId: clients[4].id // InnovTech CI
      }
    })
  ]);

  console.log('✅ Missions informatiques créées');

  // Créer quelques interventions d'exemple
  const interventions = await Promise.all([
    prisma.intervention.upsert({
      where: { id: 1 },
      update: {},
      create: {
        dateHeureDebut: new Date('2025-07-25T08:00:00Z'),
        dateHeureFin: null, // En cours
        missionId: missions[0].numIntervention,
      }
    }),
    prisma.intervention.upsert({
      where: { id: 2 },
      update: {},
      create: {
        dateHeureDebut: new Date('2025-07-30T10:00:00Z'),
        dateHeureFin: null, // En cours
        missionId: missions[3].numIntervention,
      }
    }),
    prisma.intervention.upsert({
      where: { id: 3 },
      update: {},
      create: {
        dateHeureDebut: new Date('2025-07-20T14:00:00Z'),
        dateHeureFin: new Date('2025-07-20T18:00:00Z'), // Terminée
        duree: 240, // 4 heures
        missionId: missions[4].numIntervention,
      }
    })
  ]);

  console.log('✅ Interventions créées');

  // Assigner des techniciens aux interventions
  await Promise.all([
    // Intervention audit sécurité - Kabre Theodore (Sécurité)
    prisma.technicienIntervention.upsert({
      where: { 
        technicienId_interventionId: {
          technicienId: techniciens[0].id,
          interventionId: interventions[0].id
        }
      },
      update: {},
      create: {
        technicienId: techniciens[0].id,
        interventionId: interventions[0].id,
        role: 'principal',
        commentaire: 'Expert sécurité - Responsable audit complet'
      }
    }),
    // Intervention portail gouvernemental - Anguy Evra (Dev Web) + Ouattara Siaka (DevOps)
    prisma.technicienIntervention.upsert({
      where: { 
        technicienId_interventionId: {
          technicienId: techniciens[1].id,
          interventionId: interventions[1].id
        }
      },
      update: {},
      create: {
        technicienId: techniciens[1].id,
        interventionId: interventions[1].id,
        role: 'principal',
        commentaire: 'Développeur principal - Frontend et backend'
      }
    }),
    prisma.technicienIntervention.upsert({
      where: { 
        technicienId_interventionId: {
          technicienId: techniciens[2].id,
          interventionId: interventions[1].id
        }
      },
      update: {},
      create: {
        technicienId: techniciens[2].id,
        interventionId: interventions[1].id,
        role: 'expert',
        commentaire: 'Expert DevOps - Infrastructure et déploiement'
      }
    }),
    // Intervention e-commerce terminée - Traore Aminata (Dev Mobile)
    prisma.technicienIntervention.upsert({
      where: { 
        technicienId_interventionId: {
          technicienId: techniciens[4].id,
          interventionId: interventions[2].id
        }
      },
      update: {},
      create: {
        technicienId: techniciens[4].id,
        interventionId: interventions[2].id,
        role: 'principal',
        commentaire: 'Développement site e-commerce et app mobile'
      }
    })
  ]);

  console.log('✅ Assignations techniciens créées');

  // Créer des matériels de stock
  const materiels = await Promise.all([
    prisma.materiel.upsert({
      where: { reference: 'PC-001' },
      update: {},
      create: {
        reference: 'PC-001',
        designation: 'Ordinateur portable Dell Latitude',
        description: 'PC portable professionnel pour développement',
        quantiteTotale: 10,
        quantiteDisponible: 8,
        seuilAlerte: 3,
        emplacement: 'Bureau - Étagère A1',
        categorie: 'Équipement',
        prixUnitaire: 850000,
        fournisseur: 'Dell Côte d\'Ivoire',
        dateAchat: new Date('2024-01-15'),
        garantie: '3 ans'
      }
    }),
    prisma.materiel.upsert({
      where: { reference: 'CAB-001' },
      update: {},
      create: {
        reference: 'CAB-001',
        designation: 'Câble réseau RJ45 Cat6',
        description: 'Câble Ethernet haute qualité',
        quantiteTotale: 50,
        quantiteDisponible: 35,
        seuilAlerte: 10,
        emplacement: 'Stock - Tiroir B2',
        categorie: 'Consommable',
        prixUnitaire: 2500,
        fournisseur: 'TechStore Abidjan'
      }
    }),
    prisma.materiel.upsert({
      where: { reference: 'SRV-001' },
      update: {},
      create: {
        reference: 'SRV-001',
        designation: 'Serveur HP ProLiant',
        description: 'Serveur rack 2U pour infrastructure',
        quantiteTotale: 3,
        quantiteDisponible: 2,
        seuilAlerte: 1,
        emplacement: 'Datacenter - Rack 1',
        categorie: 'Équipement',
        prixUnitaire: 2500000,
        fournisseur: 'HP Enterprise CI',
        dateAchat: new Date('2024-03-10'),
        garantie: '5 ans'
      }
    }),
    prisma.materiel.upsert({
      where: { reference: 'OUT-001' },
      update: {},
      create: {
        reference: 'OUT-001',
        designation: 'Tournevis de précision',
        description: 'Kit tournevis pour maintenance',
        quantiteTotale: 15,
        quantiteDisponible: 12,
        seuilAlerte: 5,
        emplacement: 'Atelier - Boîte outils',
        categorie: 'Outillage',
        prixUnitaire: 15000,
        fournisseur: 'Outillage Pro CI'
      }
    }),
    prisma.materiel.upsert({
      where: { reference: 'SEC-001' },
      update: {},
      create: {
        reference: 'SEC-001',
        designation: 'Casque de sécurité',
        description: 'Équipement de protection individuelle',
        quantiteTotale: 20,
        quantiteDisponible: 18,
        seuilAlerte: 5,
        emplacement: 'Vestiaire - Casiers',
        categorie: 'Sécurité',
        prixUnitaire: 8500,
        fournisseur: 'Sécurité Plus CI'
      }
    })
  ]);

  console.log('✅ Matériels de stock créés');

  // Créer quelques sorties de matériel
  await Promise.all([
    prisma.sortieMateriel.create({
      data: {
        materielId: materiels[0].id, // PC portable
        interventionId: interventions[0].id,
        technicienId: techniciens[0].id,
        quantite: 1,
        motif: 'Audit sécurité sur site client',
        commentaire: 'PC portable pour tests de pénétration'
      }
    }),
    prisma.sortieMateriel.create({
      data: {
        materielId: materiels[1].id, // Câbles
        interventionId: interventions[1].id,
        technicienId: techniciens[1].id,
        quantite: 5,
        motif: 'Installation réseau',
        commentaire: 'Câblage infrastructure gouvernementale'
      }
    }),
    prisma.sortieMateriel.create({
      data: {
        materielId: materiels[3].id, // Tournevis
        interventionId: interventions[2].id,
        technicienId: techniciens[4].id,
        quantite: 1,
        motif: 'Maintenance serveur',
        commentaire: 'Maintenance préventive terminée',
        retourne: true,
        dateRetour: new Date('2025-07-20T18:30:00Z'),
        quantiteRetour: 1
      }
    })
  ]);

  console.log('✅ Sorties de matériel créées');

  console.log('🎉 Seeding terminé avec succès!');
  console.log('📊 Données créées :');
  console.log('   - 4 rôles utilisateur');
  console.log('   - 5 spécialités informatiques');
  console.log('   - 4 types de paiement');
  console.log('   - 6 utilisateurs ivoiriens');
  console.log('   - 5 clients entreprises');
  console.log('   - 5 techniciens spécialisés');
  console.log('   - 5 missions informatiques');
  console.log('   - 3 interventions en cours/terminées');
  console.log('   - 5 matériels de stock');
  console.log('   - 3 sorties de matériel');
  console.log('');
  console.log('🔐 Comptes de connexion :');
  console.log('   DG : amoikon@progitek.ci / admin123');
  console.log('   Manager : beibro.yves@progitek.ci / manager123');
  console.log('   Commercial : konan.yane@progitek.ci / commercial123');
  console.log('   Technicien : kabre.theodore@progitek.ci / tech123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });