import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation de la base de données...');

  try {
    // Créer le rôle ADMIN s'il n'existe pas
    let adminRole = await prisma.role.findFirst({
      where: { libelle: 'ADMIN' }
    });

    if (!adminRole) {
      console.log('📝 Création du rôle ADMIN...');
      adminRole = await prisma.role.create({
        data: {
          libelle: 'ADMIN'
        }
      });
      console.log('✅ Rôle ADMIN créé');
    } else {
      console.log('ℹ️  Rôle ADMIN existe déjà');
    }

    // Créer le rôle USER s'il n'existe pas
    let userRole = await prisma.role.findFirst({
      where: { libelle: 'USER' }
    });

    if (!userRole) {
      console.log('📝 Création du rôle USER...');
      userRole = await prisma.role.create({
        data: {
          libelle: 'USER'
        }
      });
      console.log('✅ Rôle USER créé');
    } else {
      console.log('ℹ️  Rôle USER existe déjà');
    }

    // Créer le rôle TECHNICIEN s'il n'existe pas
    let technicienRole = await prisma.role.findFirst({
      where: { libelle: 'TECHNICIEN' }
    });

    if (!technicienRole) {
      console.log('📝 Création du rôle TECHNICIEN...');
      technicienRole = await prisma.role.create({
        data: {
          libelle: 'TECHNICIEN'
        }
      });
      console.log('✅ Rôle TECHNICIEN créé');
    } else {
      console.log('ℹ️  Rôle TECHNICIEN existe déjà');
    }

    // Vérifier si l'utilisateur admin existe
    const existingAdmin = await prisma.utilisateur.findUnique({
      where: { email: 'admin@progitek.com' }
    });

    if (!existingAdmin) {
      console.log('👤 Création de l\'utilisateur administrateur...');
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      // Créer l'utilisateur admin
      const adminUser = await prisma.utilisateur.create({
        data: {
          nom: 'Admin',
          prenom: 'System',
          email: 'admin@progitek.com',
          motDePasse: hashedPassword,
          phone: '0000000000',
          theme: 'light',
          displayName: 'Administrateur',
          status: 'active',
          roleId: adminRole.id
        }
      });
      
      console.log('✅ Utilisateur administrateur créé');
      console.log('📧 Email: admin@progitek.com');
      console.log('🔑 Mot de passe: Admin123!');
    } else {
      console.log('ℹ️  Utilisateur administrateur existe déjà');
    }

    // Créer quelques spécialités de base
    const specialites = [
      { libelle: 'Électricité', description: 'Installation et maintenance électrique' },
      { libelle: 'Plomberie', description: 'Installation et réparation de plomberie' },
      { libelle: 'Chauffage', description: 'Installation et maintenance de systèmes de chauffage' },
      { libelle: 'Climatisation', description: 'Installation et maintenance de systèmes de climatisation' },
      { libelle: 'Domotique', description: 'Installation de systèmes domotiques' }
    ];

    for (const specialite of specialites) {
      const existing = await prisma.specialite.findFirst({
        where: { libelle: specialite.libelle }
      });

      if (!existing) {
        await prisma.specialite.create({
          data: specialite
        });
        console.log(`✅ Spécialité "${specialite.libelle}" créée`);
      }
    }

    // Créer quelques types de paiement de base
    const typesPaiement = [
      { 
        libelle: 'Comptant', 
        description: 'Paiement immédiat', 
        delaiPaiement: 0, 
        tauxRemise: 0, 
        actif: true 
      },
      { 
        libelle: '30 jours', 
        description: 'Paiement à 30 jours', 
        delaiPaiement: 30, 
        tauxRemise: 0, 
        actif: true 
      },
      { 
        libelle: '60 jours', 
        description: 'Paiement à 60 jours', 
        delaiPaiement: 60, 
        tauxRemise: 0, 
        actif: true 
      }
    ];

    for (const typePaiement of typesPaiement) {
      const existing = await prisma.typePaiement.findFirst({
        where: { libelle: typePaiement.libelle }
      });

      if (!existing) {
        await prisma.typePaiement.create({
          data: typePaiement
        });
        console.log(`✅ Type de paiement "${typePaiement.libelle}" créé`);
      }
    }

    console.log('🎉 Initialisation de la base de données terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

