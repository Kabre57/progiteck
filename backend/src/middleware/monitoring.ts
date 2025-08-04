import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorCount: number;
  slowRequestCount: number;
}

class MonitoringService {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    averageResponseTime: 0,
    errorCount: 0,
    slowRequestCount: 0
  };

  private responseTimes: number[] = [];
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second
  private readonly MAX_RESPONSE_TIMES = 1000; // Keep last 1000 requests

  recordRequest(responseTime: number, statusCode: number): void {
    this.metrics.requestCount++;
    
    // Record response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
      this.responseTimes.shift();
    }
    
    // Calculate average
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    
    // Count errors
    if (statusCode >= 400) {
      this.metrics.errorCount++;
    }
    
    // Count slow requests
    if (responseTime > this.SLOW_REQUEST_THRESHOLD) {
      this.metrics.slowRequestCount++;
      logger.warn(`Slow request detected: ${responseTime}ms`);
    }
  }

  getMetrics(): PerformanceMetrics & { 
    errorRate: number; 
    slowRequestRate: number;
    uptime: number;
  } {
    return {
      ...this.metrics,
      errorRate: this.metrics.requestCount > 0 
        ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
        : 0,
      slowRequestRate: this.metrics.requestCount > 0 
        ? (this.metrics.slowRequestCount / this.metrics.requestCount) * 100 
        : 0,
      uptime: process.uptime()
    };
  }

  reset(): void {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorCount: 0,
      slowRequestCount: 0
    };
    this.responseTimes = [];
  }
}

export const monitoringService = new MonitoringService();

export const performanceMonitoring = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitoringService.recordRequest(responseTime, res.statusCode);
    
    // Log request details
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};

// Health check endpoint data
export const getHealthStatus = () => {
  const metrics = monitoringService.getMetrics();
  const memoryUsage = process.memoryUsage();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    metrics: {
      requests: {
        total: metrics.requestCount,
        averageResponseTime: Math.round(metrics.averageResponseTime),
        errorRate: Math.round(metrics.errorRate * 100) / 100,
        slowRequestRate: Math.round(metrics.slowRequestRate * 100) / 100
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    }
  };
};