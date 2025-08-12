const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Création d\'un utilisateur administrateur...');
    
    // Vérifier si un rôle admin existe
    let adminRole = await prisma.role.findFirst({
      where: { nom: 'ADMIN' }
    });
    
    if (!adminRole) {
      console.log('📝 Création du rôle ADMIN...');
      adminRole = await prisma.role.create({
        data: {
          nom: 'ADMIN',
          description: 'Administrateur système',
          permissions: ['ALL']
        }
      });
      console.log('✅ Rôle ADMIN créé');
    } else {
      console.log('ℹ️  Rôle ADMIN existe déjà');
    }
    
    // Vérifier si l'utilisateur admin existe
    const existingAdmin = await prisma.utilisateur.findUnique({
      where: { email: 'admin@progitek.com' }
    });
    
    if (existingAdmin) {
      console.log('ℹ️  Utilisateur admin existe déjà');
      return existingAdmin;
    }
    
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
    
    console.log('✅ Utilisateur admin créé avec succès');
    console.log('📧 Email: admin@progitek.com');
    console.log('🔑 Mot de passe: Admin123!');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

