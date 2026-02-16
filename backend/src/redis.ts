import Redis from 'ioredis';
import { config } from './config';

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(config.redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
                if (times > 3) {
                    console.warn('⚠️ Redis connection failed, operating without cache');
                    return null;
                }
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
        });

        redis.on('connect', () => console.log('✅ Redis connected'));
        redis.on('error', (err) => console.warn('⚠️ Redis error:', err.message));
    }
    return redis;
}

export async function connectRedis(): Promise<void> {
    try {
        const client = getRedis();
        await client.connect();
    } catch (error) {
        console.warn('⚠️ Redis connection failed, operating without cache');
    }
}

// Graceful cache operations that fall back silently
export async function cacheGet(key: string): Promise<string | null> {
    try {
        const client = getRedis();
        return await client.get(key);
    } catch {
        return null;
    }
}

export async function cacheSet(key: string, value: string, ttl?: number): Promise<void> {
    try {
        const client = getRedis();
        if (ttl) {
            await client.setex(key, ttl, value);
        } else {
            await client.set(key, value);
        }
    } catch {
        // silently fail
    }
}

export async function cacheDel(key: string): Promise<void> {
    try {
        const client = getRedis();
        await client.del(key);
    } catch {
        // silently fail
    }
}
