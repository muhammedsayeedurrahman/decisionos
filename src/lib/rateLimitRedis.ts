/**
 * Redis-based Rate Limiting
 *
 * Uses Upstash Ratelimit for distributed rate limiting across all instances.
 * Automatically falls back to in-memory rate limiting if Redis not configured.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';
import { isDemoMode } from './env';

/**
 * Rate limiter for transcription endpoint
 * Limit: 5 requests per minute per user
 */
export const transcribeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:transcribe',
});

/**
 * Rate limiter for upload endpoint
 * Limit: 10 requests per minute per user
 */
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:upload',
});

/**
 * Rate limiter for general API endpoints
 * Limit: 60 requests per minute per user
 */
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

/**
 * Check rate limit and return formatted response
 *
 * @param limiter - The rate limiter to use
 * @param identifier - Unique identifier (usually userId)
 * @returns Object with success status and response headers
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}> {
  // In demo mode, skip rate limiting
  if (isDemoMode()) {
    return {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 60000,
      headers: {
        'X-RateLimit-Limit': '999',
        'X-RateLimit-Remaining': '999',
        'X-RateLimit-Reset': String(Date.now() + 60000),
      },
    };
  }

  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  const headers = {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  };

  // Add Retry-After header if rate limited
  if (!success) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    headers['Retry-After'] = String(retryAfterSeconds);
  }

  return {
    success,
    limit,
    remaining,
    reset,
    headers,
  };
}

/**
 * Create rate limit response for API routes
 *
 * @param remaining - Remaining requests
 * @param reset - Reset timestamp
 */
export function createRateLimitResponse(remaining: number, reset: number) {
  const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);

  return {
    error: 'Rate limit exceeded',
    message: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
    retryAfter: retryAfterSeconds,
    reset: new Date(reset).toISOString(),
  };
}

/**
 * Get rate limit analytics
 *
 * @param prefix - Rate limit prefix (e.g., 'ratelimit:transcribe')
 */
export async function getRateLimitAnalytics(prefix: string): Promise<{
  totalRequests: number;
  blockedRequests: number;
}> {
  // This would query Redis analytics keys
  // For now, return placeholder
  return {
    totalRequests: 0,
    blockedRequests: 0,
  };
}
