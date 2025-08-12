import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { testDatabaseConnection, closeDatabaseConnection } from '@/config/database';
import { logger } from '@/config/logger';
import { generalLimiter } from '@/middleware/rateLimiter';
import { setupSwagger } from '@/config/swagger';
import { cacheService } from '@/config/cache';
import { performanceMonitoring, getHealthStatus } from '@/middleware/monitoring';
import routes from '@/routes';

const app: express.Application = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuration CORS
const corsOptions = {
  origin: NODE_ENV === 'development' ? true : (process.env.CORS_ORIGIN || 'http://localhost:5173'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors(corsOptions));

// Middleware pour gérer les requêtes OPTIONS
app.options('*', cors(corsOptions));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
app.use(generalLimiter);

// Performance monitoring
app.use(performanceMonitoring);
// Middleware de logging des requêtes
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Middleware pour prévenir les erreurs de headers
app.use((req, res, next) => {
  let isResponseSent = false;

  // Wrapper pour vérifier si la réponse a déjà été envoyée
  const originalSend = res.send;
  res.send = function (...args: any) {
    if (isResponseSent) {
      logger.warn('Attempted to send multiple responses', {
        url: req.originalUrl,
        method: req.method
      });
      return this;
    }
    isResponseSent = true;
    return originalSend.apply(this, args);
  };

  next();
});



// Health check endpoint
app.get("/health", (_req, res) => {
  res.json(getHealthStatus());
});

// Metrics endpoint
app.get("/metrics", (_req, res) => {
  const healthStatus = getHealthStatus();
  res.json(healthStatus.metrics);
});
// Routes API
app.use('/api', routes);

// Setup Swagger documentation
setupSwagger(app);
// Middleware de gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Middleware de gestion des erreurs globales
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  });
});

// Fonction de démarrage du serveur
async function startServer(): Promise<void> {
  try {
    // Test de la connexion à la base de données
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Initialize cache service
    await cacheService.connect();
    // Démarrage du serveur
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Serveur Progitek démarré sur le port ${PORT}`);
      logger.info(`📊 Environnement: ${NODE_ENV}`);
      logger.info(`🌐 CORS autorisé pour: ${corsOptions.origin}`);
      logger.info(`📖 Documentation API: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`📊 Métriques: http://localhost:${PORT}/metrics`);
    });

    // Gestion de l'arrêt gracieux
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} reçu, arrêt du serveur...`);
      
      server.close(async () => {
        logger.info('Serveur HTTP fermé');
        
        try {
          await cacheService.disconnect();
          await closeDatabaseConnection();
          logger.info('Connexion base de données fermée');
          process.exit(0);
        } catch (error) {
          logger.error('Erreur lors de la fermeture de la base de données:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Démarrage du serveur
startServer();

export default app;