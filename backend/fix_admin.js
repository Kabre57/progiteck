const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    const adminUser = await prisma.utilisateur.findUnique({
      where: { email: 'admin@progitek.com' },
      include: { role: true }
    });
    
    if (adminUser) {
      console.log('✅ Admin trouvé:', adminUser.email);
      const isValid = await bcrypt.compare('Admin123!', adminUser.motDePasse);
      console.log('🔐 Mot de passe valide:', isValid);
      
      if (!isValid) {
        const newHash = await bcrypt.hash('Admin123!', 12);
        await prisma.utilisateur.update({
          where: { id: adminUser.id },
          data: { motDePasse: newHash }
        });
        console.log('✅ Mot de passe corrigé');
      }
    } else {
      console.log('❌ Admin non trouvé - Création...');
      
      const adminRole = await prisma.role.findFirst({
        where: { libelle: 'ADMIN' }
      });
      
      if (adminRole) {
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
        
        console.log('✅ Admin créé avec ID:', newAdmin.id);
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();

