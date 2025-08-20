/**
 * Rate Limiter Implementation
 * 
 * Simple in-memory rate limiter using sliding window algorithm
 * for protecting API endpoints from abuse and spam.
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  burstAllowance?: number; // Additional burst capacity (default: 0)
}

interface RequestData {
  timestamps: number[];
  burstUsed: number;
}

// In-memory storage for rate limiting data
// In production, consider using Redis or similar persistent storage
const requestStore = new Map<string, RequestData>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    requestStore.forEach((data, key) => {
      if (
        data.timestamps.length === 0 ||
        now - data.timestamps[data.timestamps.length - 1] > maxAge
      ) {
        requestStore.delete(key);
      }
    });
  }, CLEANUP_INTERVAL);
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number; // Total allowed requests in window (max + burst)
  resetTime: number; // Timestamp when the limit resets (ms since epoch)
  remaining: number; // Remaining requests in current window
  retryAfter?: number; // Seconds to wait before retry (if blocked)
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const burstAllowance = config.burstAllowance || 0;
  
  // Get or create request data for this identifier
  let requestData = requestStore.get(identifier);
  if (!requestData) {
    requestData = { timestamps: [], burstUsed: 0 };
    requestStore.set(identifier, requestData);
  }
  
  // Remove timestamps outside the current window
  requestData.timestamps = requestData.timestamps.filter(
    timestamp => timestamp > windowStart
  );
  
  // Reset burst usage if we're in a new window period
  const oldestTimestamp = requestData.timestamps[0];
  if (!oldestTimestamp || now - oldestTimestamp >= config.windowMs) {
    requestData.burstUsed = 0;
  }
  
  const currentRequests = requestData.timestamps.length;
  const totalAllowed = config.maxRequests + burstAllowance;

  // Determine the oldest request inside the current window (if any)
  const oldestRequest = requestData.timestamps[0] ?? now;
  const windowResetTime = oldestRequest + config.windowMs; // accurate reset for current window

  if (currentRequests >= totalAllowed) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((windowResetTime - now) / 1000);

    return {
      allowed: false,
      limit: totalAllowed,
      resetTime: windowResetTime,
      remaining: 0,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  // Request is allowed - record it now
  requestData.timestamps.push(now);

  // Track burst usage when exceeding base maxRequests
  if (currentRequests + 1 > config.maxRequests) {
    requestData.burstUsed++;
  }

  const remainingAfter = Math.max(0, totalAllowed - (currentRequests + 1));

  return {
    allowed: true,
    limit: totalAllowed,
    resetTime: windowResetTime,
    remaining: remainingAfter,
  };
}

/**
 * Get the client IP address from request headers
 */
export function getClientIP(request: Request | any): string {
  // Prefer framework-provided IP first (NextRequest.ip)
  const reqAny = request as any;
  if (reqAny && typeof reqAny.ip === 'string' && reqAny.ip.length > 0) {
    return reqAny.ip;
  }

  // Check various headers in order of preference
  const headers = [
    'cf-connecting-ip', // Cloudflare
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded',
    'x-cluster-client-ip',
    'forwarded-for',
    'forwarded'
  ];

  for (const header of headers) {
    const value = request.headers?.get?.(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (ip) return ip;
    }
  }

  // Fallback
  return 'unknown';
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Lead generation endpoint - stricter limits
  lead: {
    windowMs: parseInt(process.env.RATE_LIMIT_LEAD_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_LEAD_MAX || '3'), // 3 requests per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_LEAD_BURST || '1') // 1 burst request
  },
  
  // Rankings endpoint - moderate limits
  rankings: {
    windowMs: parseInt(process.env.RATE_LIMIT_RANKINGS_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_RANKINGS_MAX || '30'), // 30 requests per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_RANKINGS_BURST || '10') // 10 burst requests
  },
  
  // Events endpoint - moderate limits
  events: {
    windowMs: parseInt(process.env.RATE_LIMIT_EVENTS_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_EVENTS_MAX || '20'), // 20 requests per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_EVENTS_BURST || '5') // 5 burst requests
  },
  
  // Auth callbacks - more lenient but still protected
  auth: {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10'), // 10 requests per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_AUTH_BURST || '5') // 5 burst requests
  },
  
  // Admin endpoints - balanced limits for authenticated admin users
  admin: {
    windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '60'), // 60 requests per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_ADMIN_BURST || '15') // 15 burst requests
  },
  
  // Pair invite creation (email/code) - stricter to prevent abuse
  invites: {
    windowMs: parseInt(process.env.RATE_LIMIT_INVITES_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_INVITES_MAX || '5'), // 5 requests per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_INVITES_BURST || '2') // small burst
  },

  // Join by code lookups - moderate
  invites_join: {
    windowMs: parseInt(process.env.RATE_LIMIT_INVITES_JOIN_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_INVITES_JOIN_MAX || '15'), // 15 per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_INVITES_JOIN_BURST || '5')
  },

  // Accept/decline actions - low frequency
  invites_action: {
    windowMs: parseInt(process.env.RATE_LIMIT_INVITES_ACTION_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_INVITES_ACTION_MAX || '10'), // 10 per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_INVITES_ACTION_BURST || '3')
  },
  
  // Invite preview by token - stricter to prevent brute force
  invites_preview: {
    windowMs: parseInt(process.env.RATE_LIMIT_INVITES_PREVIEW_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_INVITES_PREVIEW_MAX || '8'), // 8 per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_INVITES_PREVIEW_BURST || '2')
  },
  
  // Default rate limit for other endpoints
  default: {
    windowMs: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW_MS || '60000'), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX || '100'), // 100 requests per minute
    burstAllowance: parseInt(process.env.RATE_LIMIT_DEFAULT_BURST || '20') // 20 burst requests
  }
} as const;

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  // Disable in development by default, unless explicitly enabled
  if (process.env.NODE_ENV === 'development') {
    return process.env.ENABLE_RATE_LIMITING === 'true';
  }
  
  // Enable in production by default, unless explicitly disabled
  return process.env.DISABLE_RATE_LIMITING !== 'true';
}

/**
 * Safe list of IPs/patterns that should bypass rate limiting
 */
export function isIPSafeListed(ip: string): boolean {
  const safeList = process.env.RATE_LIMIT_SAFE_LIST?.split(',').map(ip => ip.trim()) || [];
  
  // Add Vercel preview IPs if configured
  if (process.env.VERCEL_ENV === 'preview') {
    safeList.push('127.0.0.1', 'localhost');
  }
  
  return safeList.includes(ip) || safeList.includes('*');
}