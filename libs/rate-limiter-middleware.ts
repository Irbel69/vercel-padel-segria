/**
 * Rate Limiting Middleware
 * 
 * Middleware functions to apply rate limiting to specific endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  checkRateLimit, 
  getClientIP, 
  isRateLimitingEnabled, 
  isIPSafeListed,
  RATE_LIMIT_CONFIGS,
  RateLimitResult 
} from './rate-limiter';

/**
 * Create a 429 Too Many Requests response with proper headers
 */
function createRateLimitResponse(rateLimitResult: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: rateLimitResult.retryAfter
    },
    { status: 429 }
  );

  // Add rate limiting headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, rateLimitResult.remaining).toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
  
  if (rateLimitResult.retryAfter) {
    response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
  }

  return response;
}

/**
 * Add rate limiting headers to a successful response
 */
function addRateLimitHeaders(response: NextResponse, rateLimitResult: RateLimitResult): void {
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, rateLimitResult.remaining).toString());
  response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());
}

/**
 * Apply rate limiting to an API route
 */
export function withRateLimit(
  configKey: keyof typeof RATE_LIMIT_CONFIGS,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip rate limiting if disabled
    if (!isRateLimitingEnabled()) {
      return await handler(request);
    }

    const clientIP = getClientIP(request);
    
    // Skip rate limiting for safe-listed IPs
    if (isIPSafeListed(clientIP)) {
      return await handler(request);
    }

    const config = RATE_LIMIT_CONFIGS[configKey];
    const identifier = `${configKey}:${clientIP}`;
    
    const rateLimitResult = checkRateLimit(identifier, config);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for ${configKey} from IP ${clientIP}`);
      return createRateLimitResponse(rateLimitResult);
    }

    // Execute the handler
    const response = await handler(request);
    
    // Add rate limiting headers to successful responses
    addRateLimitHeaders(response, rateLimitResult);
    
    return response;
  };
}

/**
 * Apply rate limiting in middleware for specific paths
 */
export function applyRateLimit(request: NextRequest): NextResponse | null {
  // Skip rate limiting if disabled
  if (!isRateLimitingEnabled()) {
    return null;
  }

  const clientIP = getClientIP(request);
  
  // Skip rate limiting for safe-listed IPs
  if (isIPSafeListed(clientIP)) {
    return null;
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Determine which rate limit config to use based on path
  let configKey: keyof typeof RATE_LIMIT_CONFIGS = 'default';
  let identifier = `default:${clientIP}`;
  
  if (pathname.startsWith('/api/lead')) {
    configKey = 'lead';
    identifier = `lead:${clientIP}`;
  } else if (pathname.startsWith('/api/rankings')) {
    configKey = 'rankings';
    identifier = `rankings:${clientIP}`;
  } else if (pathname.startsWith('/api/events')) {
    configKey = 'events';
    identifier = `events:${clientIP}`;
  } else if (pathname.startsWith('/api/invites/join')) {
    configKey = 'invites_join';
    identifier = `invites_join:${clientIP}`;
  } else if (pathname.startsWith('/api/invites/') && (pathname.endsWith('/accept') || pathname.endsWith('/decline'))) {
    configKey = 'invites_action';
    identifier = `invites_action:${clientIP}`;
  } else if (pathname.startsWith('/api/events/') && pathname.endsWith('/invite')) {
    configKey = 'invites';
    identifier = `invites:${clientIP}`;
  } else if (pathname.startsWith('/api/auth')) {
    configKey = 'auth';
    identifier = `auth:${clientIP}`;
  } else if (!pathname.startsWith('/api/')) {
    // Don't rate limit non-API routes in middleware
    return null;
  }
  
  const config = RATE_LIMIT_CONFIGS[configKey];
  const rateLimitResult = checkRateLimit(identifier, config);
  
  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for ${pathname} from IP ${clientIP}`);
    return createRateLimitResponse(rateLimitResult);
  }
  
  // Request is allowed, continue processing
  return null;
}

/**
 * Middleware function to detect suspicious patterns
 */
export function detectSuspiciousActivity(request: NextRequest): boolean {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  
  // Log suspicious patterns but don't block (for now)
  const suspiciousPatterns = [
    // Common bot user agents
    /bot|crawler|spider|scraper/i,
    // Empty or very short user agents
    /^.{0,10}$/,
    // Suspicious request patterns
    /curl|wget|python|go-http-client/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    console.warn(`Suspicious activity detected from IP ${clientIP}: ${userAgent} requesting ${url.pathname}`);
  }
  
  return isSuspicious;
}