/**
 * Rate Limiting Utility
 *
 * Provides rate limiting for API routes using Upstash Redis or in-memory fallback
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory store for rate limiting when Redis is not available
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  async limit(identifier: string, limit: number, window: number): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now();
    const windowStart = now - window;

    // Get existing requests for this identifier
    const existing = this.requests.get(identifier) || [];

    // Filter out requests outside the window
    const validRequests = existing.filter((timestamp) => timestamp > windowStart);

    // Check if limit is exceeded
    if (validRequests.length >= limit) {
      return { success: false, remaining: 0 };
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    // Clean up old entries periodically (every 100 requests)
    if (this.requests.size > 100) {
      for (const [key, timestamps] of this.requests.entries()) {
        const valid = timestamps.filter((t) => t > windowStart);
        if (valid.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, valid);
        }
      }
    }

    return { success: true, remaining: limit - validRequests.length };
  }
}

// Create rate limiter instance
let rateLimiter: Ratelimit | InMemoryRateLimiter;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Use Upstash Redis for production
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  rateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
    analytics: true,
  });
} else {
  // Fallback to in-memory rate limiting
  console.warn('⚠️  Using in-memory rate limiting (Redis not configured)');
  rateLimiter = new InMemoryRateLimiter();
}

/**
 * Check rate limit for a given identifier
 *
 * @param identifier - Unique identifier (e.g., user ID, IP address)
 * @param limit - Maximum number of requests (default: 10)
 * @param window - Time window in milliseconds (default: 10000ms = 10s)
 * @returns Object with success boolean and remaining count
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 10000
): Promise<{ success: boolean; remaining: number }> {
  try {
    if (rateLimiter instanceof InMemoryRateLimiter) {
      return await rateLimiter.limit(identifier, limit, window);
    } else {
      const result = await rateLimiter.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
      };
    }
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow request on error (fail open)
    return { success: true, remaining: limit };
  }
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(remaining: number, limit: number = 10): HeadersInit {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
  };
}
