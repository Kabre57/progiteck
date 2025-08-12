import winston from 'winston';
import path from 'path';

// Configuration des niveaux de log
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Couleurs pour les logs en développement
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// Format pour les logs en développement
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${
      info.metadata && Object.keys(info.metadata).length > 0 
        ? ' ' + JSON.stringify(info.metadata, null, 2)
        : ''
    }`
  )
);

// Format pour les logs en production (JSON structuré)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] })
);

// Configuration des transports
const transports: winston.transport[] = [];

// Console transport (toujours actif)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat
  })
);

// File transports pour la production
if (process.env.NODE_ENV === 'production') {
  // Log général
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'app.log'),
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Log des erreurs
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );

  // Log des accès HTTP
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'access.log'),
      level: 'http',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10
    })
  );
}

// Création du logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  transports,
  exitOnError: false,
  // Gestion des exceptions non capturées
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: productionFormat
    })
  ],
  // Gestion des rejections non capturées
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: productionFormat
    })
  ]
});

// Middleware pour Express
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Fonction utilitaire pour logger les métriques
export const logMetrics = (metrics: Record<string, any>) => {
  logger.info('Metrics', { 
    service: 'progitek-api',
    type: 'metrics',
    ...metrics 
  });
};

// Fonction utilitaire pour logger les événements de sécurité
export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  logger.warn('Security event', {
    service: 'progitek-api',
    type: 'security',
    event,
    ...details
  });
};

// Fonction utilitaire pour logger les erreurs de base de données
export const logDatabaseError = (operation: string, error: Error, context?: Record<string, any>) => {
  logger.error('Database error', {
    service: 'progitek-api',
    type: 'database',
    operation,
    error: error.message,
    stack: error.stack,
    ...context
  });
};

// Fonction utilitaire pour logger les événements d'authentification
export const logAuthEvent = (event: string, userId?: number, details?: Record<string, any>) => {
  logger.info('Authentication event', {
    service: 'progitek-api',
    type: 'auth',
    event,
    userId,
    ...details
  });
};

// Créer le dossier logs s'il n'existe pas
if (process.env.NODE_ENV === 'production') {
  const fs = require('fs');
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

export default logger;

