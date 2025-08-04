import { Request, Response, NextFunction } from 'express';
import { cacheService } from '@/config/cache';
import { logger } from '@/config/logger';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export const cache = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req: Request) => `${req.method}:${req.originalUrl}`,
    condition = (req: Request) => req.method === 'GET'
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip caching if condition not met
    if (!condition(req) || !cacheService.isReady()) {
      next();
      return;
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        res.json(cachedData);
        return;
      }

      // Cache miss - store original json method
      const originalJson = res.json;
      
      res.json = function(data: unknown) {
        // Cache the response
        if (res.statusCode === 200) {
          cacheService.set(cacheKey, data, ttl).catch(err => 
            logger.error('Failed to cache response:', err)
          );
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json;
    
    res.json = function(data: unknown) {
      // Invalidate cache patterns after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheService.invalidatePattern(pattern).catch(err =>
            logger.error('Failed to invalidate cache pattern:', err)
          );
        });
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};