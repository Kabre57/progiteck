import rateLimit from 'express-rate-limit';
import { logger } from '@/config/logger';

export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error: 'Rate limit exceeded'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        message,
        error: 'Rate limit exceeded'
      });
    }
  });
};

// Rate limiters spécifiques avec limites de production appropriées
export const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  500, // 500 requêtes par fenêtre (limite raisonnable pour la production)
  'Trop de requêtes, veuillez réessayer plus tard'
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 tentatives de connexion par fenêtre (sécurité renforcée)
  'Trop de tentatives de connexion, veuillez réessayer plus tard'
);

export const apiLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  100, // 100 requêtes par minute (limite appropriée pour l'usage normal)
  'Limite d\'API atteinte, veuillez ralentir vos requêtes'
);