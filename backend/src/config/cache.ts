import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      if (process.env.REDIS_URL) {
        this.client = createClient({
          url: process.env.REDIS_URL,
        });

        this.client.on('error', (err) => {
          logger.error('Redis Client Error:', err);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          logger.info('Redis Client Connected');
          this.isConnected = true;
        });

        await this.client.connect();
      } else {
        logger.warn('Redis URL not configured, caching disabled');
      }
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      logger.error('Cache invalidate pattern error:', error);
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
}

export const cacheService = new CacheService();
