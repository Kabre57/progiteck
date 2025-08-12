const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('🔍 Vérification de l\'utilisateur admin...');
    
    // Chercher l'utilisateur admin
    const adminUser = await prisma.utilisateur.findUnique({
      where: { email: 'admin@progitek.com' },
      include: { role: true }
    });
    
    if (adminUser) {
      console.log('✅ Utilisateur admin trouvé:');
      console.log('📧 Email:', adminUser.email);
      console.log('👤 Nom:', adminUser.nom, adminUser.prenom);
      console.log('🔑 Rôle:', adminUser.role.libelle);
      console.log('📊 Status:', adminUser.status);
      console.log('🆔 ID:', adminUser.id);
      
      // Tester le mot de passe
      const isValidPassword = await bcrypt.compare('Admin123!', adminUser.motDePasse);
      console.log('🔐 Mot de passe valide:', isValidPassword ? '✅' : '❌');
      
      if (!isValidPassword) {
        console.log('🔧 Mise à jour du mot de passe...');
        const hashedPassword = await bcrypt.hash('Admin123!', 12);
        
        await prisma.utilisateur.update({
          where: { id: adminUser.id },
          data: { motDePasse: hashedPassword }
        });
        
        console.log('✅ Mot de passe mis à jour');
      }
      
    } else {
      console.log('❌ Utilisateur admin non trouvé');
      
      // Créer l'utilisateur admin
      console.log('🔧 Création de l\'utilisateur admin...');
      
      // Trouver le rôle ADMIN
      const adminRole = await prisma.role.findFirst({
        where: { libelle: 'ADMIN' }
      });
      
      if (!adminRole) {
        console.log('❌ Rôle ADMIN non trouvé');
        return;
      }
      
      const hashedPassword = await bcrypt.hash('Admin123!', 12);
      
      const newAdmin = await prisma.utilisateur.create({
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
      
      console.log('✅ Utilisateur admin créé avec ID:', newAdmin.id);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();

