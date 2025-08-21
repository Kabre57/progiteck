// Fichier : /src/server.ts

// ✅ IMPORTANT : Ces deux lignes doivent être les toutes premières
import 'module-alias/register';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { testDatabaseConnection, closeDatabaseConnection } from '@/config/database';
import { logger } from '@/config/logger';
import { generalLimiter } from '@/middleware/rateLimiter';
import { setupSwagger } from '@/config/swagger';
import { cacheService } from '@/config/cache';
import routes from '@/routes'; // Importe le routeur principal depuis index.ts

const app: Application = express();

// --- Configuration Essentielle ---
// Faire confiance au premier proxy (Nginx) pour obtenir la vraie IP du client
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// --- Configuration CORS Robuste ---
const allowedOrigins = [
  'http://180.149.199.94',      // Accès via IP publique (port 80 par défaut )
  'http://progiteck.tail',      // Accès via Tailscale
  'https://100.115.117.118'     // Accès HTTPS via Tailscale
];

if (NODE_ENV === 'development' ) {
  allowedOrigins.push('http://localhost:5173' );
}

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Origine CORS bloquée : ${origin}`);
      callback(new Error('Cette origine n\'est pas autorisée par la politique CORS.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// --- Middlewares Globaux ---
app.use(helmet()); // Sécurité des en-têtes HTTP
app.use(cors(corsOptions)); // Gestion des requêtes cross-origin
app.options('*', cors(corsOptions)); // Gère les requêtes pre-flight
app.use(compression()); // Compression des réponses
app.use(express.json({ limit: '10mb' })); // Parsing des body JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parsing des body URL-encoded
app.use(generalLimiter); // Limite de taux globale

// Middleware de logging des requêtes
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent' )
    });
  });
  next();
});

// --- Routes de l'Application ---
app.use('/api', routes); // Utilise le routeur principal pour toutes les routes /api

// --- Documentation API (Swagger) ---
setupSwagger(app);

// --- Gestion des Erreurs ---
// Middleware pour les routes non trouvées (404)
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    error: `Cannot ${_req.method} ${_req.originalUrl}`
  });
});

// Middleware de gestion des erreurs globales (doit être le dernier `app.use`)
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', { message: error.message, stack: error.stack });
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: NODE_ENV === 'development' ? error.message : 'Une erreur inattendue est survenue.'
  });
});

// --- Démarrage du Serveur ---
const startServer = async (): Promise<void> => {
  try {
    // 1. Connexion à la base de données
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error('Échec de la connexion à la base de données. Arrêt du serveur.');
      process.exit(1);
    }

    // 2. Connexion au cache Redis
    await cacheService.connect();

    // 3. Démarrage du serveur Express
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Serveur Progitek démarré sur le port ${PORT}`);
      logger.info(`📊 Environnement: ${NODE_ENV}`);
      logger.info(`🛡️  Paramètre 'trust proxy' configuré sur : ${app.get('trust proxy')}`);
    });

    // 4. Gestion de l'arrêt propre (graceful shutdown)
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} reçu, arrêt du serveur...`);
      server.close(async () => {
        logger.info('Serveur HTTP fermé.');
        try {
          await cacheService.disconnect();
          await closeDatabaseConnection();
          logger.info('Connexions aux services externes fermées.');
          process.exit(0);
        } catch (error) {
          logger.error('Erreur lors de la fermeture des connexions:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Erreur critique lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Lancement du serveur
startServer();

export default app;
