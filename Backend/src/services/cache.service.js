import Redis from "ioredis";
import logger from "../utils/logger.js";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379;
const redisPassword = process.env.REDIS_PASSWORD || undefined;

let isRedisConnected = false;
let redisClient = null;

try {
    redisClient = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
            if (times > 3) return null; // Stop retrying Redis, use memory fallback
            return Math.min(times * 200, 1000);
        },
    });

    redisClient.on("connect", () => {
        isRedisConnected = true;
        logger.info("[CacheService] Connected to Redis primary cache.");
    });

    redisClient.on("error", (err) => {
        isRedisConnected = false;
        logger.warn(`[CacheService] Redis Notice: ${err.message}. Using In-Memory Fallback.`);
    });

    redisClient.connect().catch((err) => {
        isRedisConnected = false;
        logger.warn(`[CacheService] Redis lazyConnect notice: ${err.message}`);
    });
} catch (err) {
    isRedisConnected = false;
    logger.warn(`[CacheService] Redis init notice: ${err.message}`);
}

class MemoryCache {
    constructor(maxSize = 5000) {
        this.store = new Map();
        this.maxSize = maxSize;
    }

    set(key, value, ttlSeconds) {
        const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;

        if (this.store.has(key)) {
            this.store.delete(key);
        } else if (this.store.size >= this.maxSize) {
            const oldestKey = this.store.keys().next().value;
            if (oldestKey !== undefined) {
                this.store.delete(oldestKey);
            }
        }

        this.store.set(key, { value, expiresAt });
    }

    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    del(key) {
        this.store.delete(key);
    }

    delPattern(pattern) {
        const regexStr = "^" + pattern.replace(/\*/g, ".*") + "$";
        const regex = new RegExp(regexStr);
        for (const key of Array.from(this.store.keys())) {
            if (regex.test(key)) {
                this.store.delete(key);
            }
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.store.entries()) {
            if (item.expiresAt && now > item.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}

const memoryFallback = new MemoryCache(5000);

export const cacheService = {
    async get(key) {
        if (isRedisConnected && redisClient) {
            try {
                const data = await redisClient.get(key);
                if (data !== null) {
                    return JSON.parse(data);
                }
            } catch (err) {
                logger.warn(`[CacheService] Redis GET error for key ${key}: ${err.message}`);
            }
        }
        return memoryFallback.get(key);
    },

    async set(key, value, ttlSeconds = 300) {
        // Update memory fallback cache
        memoryFallback.set(key, value, ttlSeconds);

        if (isRedisConnected && redisClient) {
            try {
                const serialized = JSON.stringify(value);
                if (ttlSeconds) {
                    await redisClient.set(key, serialized, "EX", ttlSeconds);
                } else {
                    await redisClient.set(key, serialized);
                }
            } catch (err) {
                logger.warn(`[CacheService] Redis SET error for key ${key}: ${err.message}`);
            }
        }
    },

    async del(key) {
        memoryFallback.del(key);
        if (isRedisConnected && redisClient) {
            try {
                await redisClient.del(key);
            } catch (err) {
                logger.warn(`[CacheService] Redis DEL error for key ${key}: ${err.message}`);
            }
        }
    },

    async delPattern(pattern) {
        memoryFallback.delPattern(pattern);
        if (isRedisConnected && redisClient) {
            try {
                let cursor = "0";
                do {
                    const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
                    cursor = nextCursor;
                    if (keys && keys.length > 0) {
                        await redisClient.del(...keys);
                    }
                } while (cursor !== "0");
            } catch (err) {
                logger.warn(`[CacheService] Redis DEL PATTERN error for pattern ${pattern}: ${err.message}`);
            }
        }
    },
};

export default cacheService;

