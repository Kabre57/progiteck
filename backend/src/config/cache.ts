import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

/**
 * Service de cache Redis avec gestion avancée des connexions,
 * sérialisation et opérations de cache.
 */
class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly baseReconnectDelay = 1000;

  /**
   * Initialise la connexion à Redis et configure les gestionnaires d'événements
   */
  async connect(): Promise<void> {
    if (!process.env.REDIS_URL) {
      logger.warn('Redis URL not configured, caching disabled');
      return;
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            const delay = Math.min(
              this.baseReconnectDelay * Math.pow(2, retries),
              15000 // Max 15s de délai
            );
            logger.warn(`Tentative de reconnexion Redis #${retries} dans ${delay}ms`);
            return delay;
          },
          tls: process.env.NODE_ENV === 'production' ? {} : undefined
        },
        pingInterval: 30000 // Envoie un PING toutes les 30s pour maintenir la connexion
      });

      this.setupEventListeners();
      await this.client.connect();
      this.isConnected = true;
      logger.info('Connexion Redis établie avec succès');
    } catch (error) {
      logger.error('Échec de la connexion à Redis:', error);
      this.isConnected = false;
      await this.handleReconnect();
    }
  }

  /**
   * Configure les écouteurs d'événements pour le client Redis
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('error', (err) => {
      logger.error('Erreur Redis:', err);
      this.isConnected = false;
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('Redis prêt');
    });

    this.client.on('end', () => {
      this.isConnected = false;
      logger.warn('Connexion Redis fermée');
      this.handleReconnect();
    });

    this.client.on('reconnecting', () => {
      logger.info('Tentative de reconnexion à Redis...');
    });
  }

  /**
   * Gère la reconnexion automatique avec backoff exponentiel
   */
  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Nombre maximal de tentatives de reconnexion atteint');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      15000
    );

    setTimeout(async () => {
      logger.info(`Tentative de reconnexion #${this.reconnectAttempts}`);
      await this.connect();
    }, delay);
  }

  /**
   * Récupère une valeur depuis le cache
   * @param key Clé du cache
   * @returns La valeur désérialisée ou null si non trouvée
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;

    try {
      const value = await this.client!.get(key);
      return value ? this.deserialize<T>(value) : null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la clé ${key}:`, error);
      return null;
    }
  }

  /**
   * Stocke une valeur dans le cache avec TTL
   * @param key Clé du cache
   * @value Valeur à stocker
   * @ttlSeconds Durée de vie en secondes (par défaut 5 minutes)
   */
  async set(key: string, value: unknown, ttlSeconds = 300): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const serialized = this.serialize(value);
      if (ttlSeconds > 0) {
        await this.client!.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client!.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Erreur lors du stockage de la clé ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprime une clé du cache
   * @param key Clé à supprimer
   */
  async del(key: string): Promise<boolean> {
    if (!this.isReady()) return false;

    try {
      const result = await this.client!.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la clé ${key}:`, error);
      return false;
    }
  }

  /**
   * Supprime toutes les clés correspondant à un motif
   * @param pattern Motif de clés à supprimer (ex: 'user:*')
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.isReady()) return 0;

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length === 0) return 0;
      
      const deleted = await this.client!.del(keys);
      logger.info(`Invalidation de ${deleted} clés pour le motif ${pattern}`);
      return deleted;
    } catch (error) {
      logger.error(`Erreur lors de l'invalidation du motif ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Récupère plusieurs valeurs en une seule requête
   * @param keys Tableau de clés à récupérer
   */
  async mget<T>(keys: string[]): Promise<Record<string, T | null>> {
    if (!this.isReady()) return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});

    try {
      const values = await this.client!.mGet(keys);
      const result: Record<string, T | null> = {};
      
      keys.forEach((key, index) => {
        result[key] = values[index] ? this.deserialize<T>(values[index]!) : null;
      });
      
      return result;
    } catch (error) {
      logger.error('Erreur lors de la récupération multiple:', error);
      return keys.reduce((acc, key) => ({ ...acc, [key]: null }), {});
    }
  }

  /**
   * Stocke plusieurs valeurs en une seule requête
   * @param items Tableau d'objets {key, value, ttl?}
   */
  async mset(items: {key: string; value: unknown; ttl?: number}[]): Promise<boolean> {
    if (!this.isReady() || items.length === 0) return false;

    try {
      const pipeline = this.client!.multi();
      
      items.forEach(({key, value, ttl}) => {
        const serialized = this.serialize(value);
        if (ttl && ttl > 0) {
          pipeline.setEx(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Erreur lors du stockage multiple:', error);
      return false;
    }
  }

  /**
   * Récupère ou calcule et stocke une valeur si absente (cache-aside pattern)
   * @param key Clé du cache
   * @param fallback Fonction de calcul de la valeur si absente
   * @param ttl Durée de vie en secondes pour la nouvelle valeur
   */
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const fresh = await fallback();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  /**
   * Vérifie si le service est prêt à traiter des requêtes
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Vérifie la santé du service
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isReady()) return false;
    
    try {
      await this.client!.ping();
      return true;
    } catch (error) {
      this.isConnected = false;
      logger.error('Échec du health check Redis:', error);
      return false;
    }
  }

  /**
   * Ferme proprement la connexion Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
      } catch (error) {
        logger.error('Erreur lors de la fermeture de Redis:', error);
      } finally {
        this.isConnected = false;
        this.client = null;
      }
    }
  }

  /**
   * Sérialise une valeur pour le stockage
   */
  private serialize(value: unknown): string {
    if (typeof value === 'string') return value;
    
    return JSON.stringify(value, (_, val) => {
      // Gestion des types spéciaux
      if (typeof val === 'bigint') return `bigint:${val.toString()}`;
      if (val instanceof Date) return `date:${val.toISOString()}`;
      if (val instanceof Buffer) return `buffer:${val.toString('base64')}`;
      return val;
    });
  }

  /**
   * Désérialise une valeur stockée
   */
  private deserialize<T>(value: string): T {
    try {
      return JSON.parse(value, (_, val) => {
        if (typeof val !== 'string') return val;
        
        // Reconstruction des types spéciaux
        if (val.startsWith('bigint:')) return BigInt(val.slice(7));
        if (val.startsWith('date:')) return new Date(val.slice(5));
        if (val.startsWith('buffer:')) return Buffer.from(val.slice(7), 'base64');
        return val;
      });
    } catch (error) {
      logger.error('Erreur de désérialisation, retour de la valeur brute');
      return value as unknown as T;
    }
  }
}

// Exporte une instance singleton du service de cache
export const cacheService = new CacheService();

// Connexion automatique au démarrage
cacheService.connect().catch(err => {
  logger.error('Échec de la connexion initiale à Redis:', err);
});