import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';
import os from 'os';

interface HealthMetrics {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  database: {
    status: string;
    connections: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  requests: {
    total: number;
    averageResponseTime: number;
    errorRate: number;
  };
}
// Fonction pour obtenir les métriques CPU
function getCpuMetrics(logger: any): { usage: number; loadAverage: number[] } {
  let loadAvg: number[] = [0, 0, 0];
  let usage = 0;
  if (typeof os.loadavg === 'function') {
    const result = os.loadavg();
    if (Array.isArray(result) && result.length > 0) {
      loadAvg = result;
      if (typeof loadAvg[0] === 'number') {
        usage = Math.round(loadAvg[0] * 100) / 100;
      } else {
        logger.error("os.loadavg()[0] est indéfini ou non numérique");
      }
    } else {
      logger.error("os.loadavg() ne retourne pas un tableau valide");
    }
  } else {
    logger.error("os.loadavg n'est pas une fonction");
  }
  return {
    usage,
    loadAverage: loadAvg
  };
}
let totalRequests = 0;
let totalErrors = 0;
let totalResponseTime = 0;
const startTime = Date.now();

// Middleware de monitoring des performances
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Incrémenter le compteur de requêtes
  totalRequests++;
  
  // Logger la requête entrante
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    service: 'progitek-api'
  });

  // Intercepter la fin de la réponse
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    totalResponseTime += duration;
    
    // Compter les erreurs
    if (res.statusCode >= 400) {
      totalErrors++;
    }
    
    // Logger la réponse
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      service: 'progitek-api'
    });
  });

  next();
};

// Middleware de monitoring des erreurs
export const errorMonitoring = (error: Error, req: Request, _res: Response, next: NextFunction): void => {
  totalErrors++;
  
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    service: 'progitek-api'
  });
  
  next(error);
};

// Fonction pour obtenir les métriques système
const getSystemMetrics = () => {
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    memory: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round((usedMem / totalMem) * 100)
    },
  cpu: getCpuMetrics(logger),
    process: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024) // MB
    }
  };
};

// Fonction pour obtenir le statut de santé complet
export const getHealthStatus = (): HealthMetrics => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  const systemMetrics = getSystemMetrics();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime,
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: 'connected', // À améliorer avec une vraie vérification
      connections: 0 // À implémenter avec Prisma metrics
    },
    memory: systemMetrics.memory,
    cpu: systemMetrics.cpu,
    requests: {
      total: totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100
    },
  // ...existing code...
  };
};

// Middleware de surveillance de la santé
export const healthCheck = (_req: Request, res: Response): void => {
  const healthStatus = getHealthStatus();
  
  // Déterminer le statut basé sur les métriques
  let status = 'healthy';
  if (healthStatus.memory.percentage > 90) status = 'warning';
  if (healthStatus.cpu.usage > 80) status = 'warning';
  if (healthStatus.requests.errorRate > 10) status = 'critical';
  
  healthStatus.status = status;
  
  const httpStatus = status === 'healthy' ? 200 : status === 'warning' ? 200 : 503;
  res.status(httpStatus).json(healthStatus);
};

// Fonction pour logger les métriques périodiquement
export const logMetricsPeriodically = (): void => {
  setInterval(() => {
    const metrics = getHealthStatus();
    logger.info('System metrics', {
      service: 'progitek-api',
      metrics: {
        totalRequests: metrics.requests.total,
        averageResponseTime: metrics.requests.averageResponseTime,
        errorRate: metrics.requests.errorRate,
        memoryUsage: metrics.memory.percentage,
        cpuUsage: metrics.cpu.usage,
        uptime: metrics.uptime
      }
    });
  }, 60000); // Toutes les minutes
};

// Middleware de sécurité pour les headers
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Headers de sécurité
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // CSP pour la production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self'; " +
      "font-src 'self'; " +
      "object-src 'none'; " +
      "media-src 'self'; " +
      "frame-src 'none';"
    );
  }
  
  next();
};

