import { PrismaClient } from '@prisma/client';

// Configuration du client Prisma avec options de logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Gestion des événements de logging
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  }
});

prisma.$on('error', (e) => {
  console.error('Prisma Error:', e);
});

prisma.$on('info', (e) => {
  console.info('Prisma Info:', e);
});

prisma.$on('warn', (e) => {
  console.warn('Prisma Warning:', e);
});

// Fonction pour gérer la déconnexion propre
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

// Fonction pour vérifier la connexion à la base de données
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connexion à la base de données établie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
};

// Fonction pour obtenir les statistiques de la base de données
export const getDatabaseStats = async () => {
  try {
    const stats = await prisma.$transaction([
      prisma.utilisateur.count(),
      prisma.client.count(),
      prisma.mission.count(),
      prisma.intervention.count(),
      prisma.devis.count(),
      prisma.materiel.count(),
    ]);

    return {
      utilisateurs: stats[0],
      clients: stats[1],
      missions: stats[2],
      interventions: stats[3],
      devis: stats[4],
      materiels: stats[5],
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

export default prisma;

