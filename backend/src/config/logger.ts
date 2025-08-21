// Fichier : /var/www/progiteck/backend/src/config/logger.ts

import winston from 'winston';
import 'winston-daily-rotate-file'; // Assurez-vous d'installer ce module
import path from 'path';
import fs from 'fs';

// --- Configuration de base ---
const logLevels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const logColors = { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'white' };
winston.addColors(logColors );

const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const NODE_ENV = process.env.NODE_ENV || 'development';

// Créer le dossier de logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// --- Formats de log ---
// Format pour la console en développement (lisible et coloré)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
);

// Format JSON structuré pour les fichiers (idéal pour la production et l'analyse)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// --- Transports (Destinations des logs) ---
const transports: winston.transport[] = [
  // Toujours logger dans la console
  new winston.transports.Console({
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    format: consoleFormat,
  }),
];

// Ajouter les transports par fichier uniquement en production
if (NODE_ENV === 'production') {
  transports.push(
    // Fichier pour toutes les erreurs critiques
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Conserver 14 jours
    }),
    // Fichier pour tous les logs
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d', // Conserver 7 jours
    })
  );
}

// --- Création du Logger ---
export const logger = winston.createLogger({
  levels: logLevels,
  format: fileFormat, // Format par défaut pour les transports qui n'en ont pas
  transports,
  exitOnError: false,
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(LOG_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
    }),
  ],
});

// --- Fonctions utilitaires (inchangées, elles sont très bien) ---
export const morganStream = { write: (message: string) => logger.http(message.trim( )) };
export const logMetrics = (metrics: Record<string, any>) => logger.info('Metrics', { service: 'progitek-api', type: 'metrics', ...metrics });
// ... vos autres fonctions utilitaires ...
