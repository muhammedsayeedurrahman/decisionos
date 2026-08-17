/**
 * Simple in-memory rate limiter
 * For production, use Redis or Upstash
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimit = new Map<string, RateLimitRecord>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimit.entries()) {
    if (now > record.resetTime) {
      rateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const now = Date.now();
  const record = rateLimit.get(identifier);

  // No record or window expired - allow and create new record
  if (!record || now > record.resetTime) {
    rateLimit.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  // Within window - check if under limit
  if (record.count >= limit) {
    return false;
  }

  // Increment count
  record.count++;
  return true;
}

/**
 * Get remaining requests for an identifier
 */
export function getRateLimitInfo(identifier: string, limit: number = 10): {
  remaining: number;
  resetTime: number;
} {
  const record = rateLimit.get(identifier);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return {
      remaining: limit,
      resetTime: now,
    };
  }

  return {
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime,
  };
}
