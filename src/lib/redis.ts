/**
 * Redis Client Configuration
 *
 * Uses Upstash Redis for serverless-friendly, distributed caching and rate limiting.
 * Falls back to mock implementation if Redis credentials not provided.
 */

import { Redis } from '@upstash/redis';
import { isDemoMode } from './env';

/**
 * Mock Redis client for local development without Upstash
 *
 * WARNING: This is for development only!
 * - Data is stored in memory and lost on restart
 * - Does not work across multiple instances
 * - Does not persist across deploys
 *
 * For production, always use real Redis.
 */
class MockRedis {
  private store = new Map<string, { value: string; expiry?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  async set(
    key: string,
    value: string,
    opts?: { ex?: number; px?: number }
  ): Promise<'OK'> {
    let expiry: number | undefined;

    if (opts?.ex) {
      expiry = Date.now() + opts.ex * 1000;
    } else if (opts?.px) {
      expiry = Date.now() + opts.px;
    }

    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0', 10) + 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue, 10);
  }

  async incrbyfloat(key: string, increment: number): Promise<string> {
    const current = await this.get(key);
    const newValue = (parseFloat(current || '0') + increment).toString();
    await this.set(key, newValue);
    return newValue;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;

    this.store.set(key, {
      ...item,
      expiry: Date.now() + seconds * 1000,
    });
    return 1;
  }

  // Clean up expired items periodically
  private cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
      }
    }
  }

  constructor() {
    // Run cleanup every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000);
    }
  }
}

// Check if Redis is configured
const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

/**
 * Redis client instance
 *
 * In production, this connects to Upstash Redis.
 * In demo mode or when Redis not configured, uses mock implementation.
 */
export const redis: Redis | MockRedis = isRedisConfigured && !isDemoMode()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : new MockRedis();

// Log which Redis implementation is being used
if (process.env.NODE_ENV !== 'test') {
  if (isRedisConfigured && !isDemoMode()) {
    console.log('✅ Redis: Using Upstash Redis');
  } else {
    console.warn(
      '⚠️  Redis: Using in-memory mock (not suitable for production)\n' +
      '   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production use'
    );
  }
}
