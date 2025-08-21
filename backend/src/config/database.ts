import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: Prisma.QueryEvent) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Params: ${JSON.stringify(e.params)}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error('Database error:', e);
});

prisma.$on('info', (e: Prisma.LogEvent) => {
  logger.info('Database info:', e);
});

prisma.$on('warn', (e: Prisma.LogEvent) => {
  logger.warn('Database warning:', e);
});

export { prisma };

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database connection closed');
}
