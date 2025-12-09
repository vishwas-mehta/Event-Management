import redisClient from '../config/redis';

// Cache key prefixes
export const CacheKeys = {
    EVENTS_LIST: 'events:list:',
    EVENT_SINGLE: 'events:single:',
    CATEGORIES: 'categories:all',
};

export const cacheService = {
    // Get cached value (returns null if not found)
    get: async <T>(key: string): Promise<T | null> => {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error('Cache get error:', err);
            return null;
        }
    },

    // Set value with TTL (in seconds)
    set: async (key: string, value: any, ttlSeconds: number = 60): Promise<void> => {
        try {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        } catch (err) {
            console.error('Cache set error:', err);
        }
    },

    // Delete specific key
    del: async (key: string): Promise<void> => {
        try {
            await redisClient.del(key);
        } catch (err) {
            console.error('Cache del error:', err);
        }
    },

    // Delete all keys matching pattern (e.g., "events:list:*")
    delByPattern: async (pattern: string): Promise<void> => {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } catch (err) {
            console.error('Cache delByPattern error:', err);
        }
    },

    // Clear all cache
    flush: async (): Promise<void> => {
        try {
            await redisClient.flushDb();
        } catch (err) {
            console.error('Cache flush error:', err);
        }
    },
};

export default cacheService;