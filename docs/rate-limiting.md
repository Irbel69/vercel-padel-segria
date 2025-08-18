# Rate Limiting and Abuse Protection

This document describes the rate limiting implementation for the Padel Segrià API endpoints to prevent spam and abuse while protecting upstream providers.

## Overview

The rate limiting system uses a sliding window algorithm with burst allowance to provide flexible protection against abuse while maintaining good user experience. It runs at the edge middleware level to save compute resources and provide fast responses.

## Endpoints Protected

The following API endpoints are protected with rate limiting:

| Endpoint | Purpose | Rate Limit | Burst Allowance | Window |
|----------|---------|------------|-----------------|--------|
| `/api/lead` | Lead generation | 3 requests | +1 burst | 1 minute |
| `/api/rankings` | Rankings data | 30 requests | +10 burst | 1 minute |
| `/api/events/public` | Public events | 20 requests | +5 burst | 1 minute |
| `/api/auth/callback` | Auth callbacks | 10 requests | +5 burst | 1 minute |
| Other `/api/*` | Default protection | 100 requests | +20 burst | 1 minute |

## Configuration

Rate limiting is configured via environment variables. All settings are optional and will use sensible defaults if not specified.

### General Settings

```bash
# Enable/disable rate limiting
ENABLE_RATE_LIMITING=false          # Force enable in development
DISABLE_RATE_LIMITING=false         # Force disable in production

# Safe list of IPs that bypass rate limiting (comma-separated)
RATE_LIMIT_SAFE_LIST=127.0.0.1,192.168.1.1
```

### Lead Endpoint Settings (Strictest)

```bash
RATE_LIMIT_LEAD_WINDOW_MS=60000     # Window size in milliseconds (1 minute)
RATE_LIMIT_LEAD_MAX=3               # Maximum requests per window
RATE_LIMIT_LEAD_BURST=1             # Additional burst capacity
```

### Rankings Endpoint Settings

```bash
RATE_LIMIT_RANKINGS_WINDOW_MS=60000 # Window size in milliseconds (1 minute)
RATE_LIMIT_RANKINGS_MAX=30          # Maximum requests per window
RATE_LIMIT_RANKINGS_BURST=10        # Additional burst capacity
```

### Events Endpoint Settings

```bash
RATE_LIMIT_EVENTS_WINDOW_MS=60000   # Window size in milliseconds (1 minute)
RATE_LIMIT_EVENTS_MAX=20            # Maximum requests per window
RATE_LIMIT_EVENTS_BURST=5           # Additional burst capacity
```

### Auth Endpoint Settings

```bash
RATE_LIMIT_AUTH_WINDOW_MS=60000     # Window size in milliseconds (1 minute)
RATE_LIMIT_AUTH_MAX=10              # Maximum requests per window
RATE_LIMIT_AUTH_BURST=5             # Additional burst capacity
```

### Default Settings (Other Endpoints)

```bash
RATE_LIMIT_DEFAULT_WINDOW_MS=60000  # Window size in milliseconds (1 minute)
RATE_LIMIT_DEFAULT_MAX=100          # Maximum requests per window
RATE_LIMIT_DEFAULT_BURST=20         # Additional burst capacity
```

## Environment-Specific Behavior

### Development Environment

- Rate limiting is **disabled by default** in development (`NODE_ENV=development`)
- Set `ENABLE_RATE_LIMITING=true` to test rate limiting during development
- All console warnings for rate limit violations are logged

### Production Environment

- Rate limiting is **enabled by default** in production
- Set `DISABLE_RATE_LIMITING=true` to disable (not recommended)
- Suspicious activity detection logs potential abuse patterns

### Vercel Preview Environment

- Localhost IPs (`127.0.0.1`, `localhost`) are automatically safe-listed
- Useful for preview deployments and testing

## Response Headers

When rate limiting is active, the following headers are included in all responses. Note: X-RateLimit-Limit reflects the total allowed in the window (base max + burst allowance):

```http
X-RateLimit-Limit: 40               # Total allowed in window (e.g., rankings 30 + burst 10)
X-RateLimit-Remaining: 25           # Remaining requests in current window
X-RateLimit-Reset: 2024-01-01T12:35:00Z  # When the window resets
```

When rate limit is exceeded (HTTP 429):

```http
Retry-After: 45                     # Seconds to wait before retry
```

## Error Response Format

When rate limit is exceeded, a 429 response is returned:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

## Implementation Details

### Sliding Window Algorithm

The rate limiter uses a sliding window approach that:

1. Tracks timestamps of recent requests per IP address
2. Removes expired timestamps outside the current window
3. Allows burst capacity beyond the base limit (Limit = max + burst)
4. Calculates precise retry timing and window reset as `oldest_request_in_window + windowMs`

### Client IP Detection

The system detects client IPs in the following order of priority:

1. `request.ip` (Next.js)
2. `cf-connecting-ip` (Cloudflare)
3. `x-forwarded-for` (first IP if multiple)
4. `x-real-ip`
5. `x-client-ip`
6. `x-forwarded`
7. `x-cluster-client-ip`
8. `forwarded-for`
9. `forwarded`

### Memory Management

- In-memory storage with automatic cleanup every 5 minutes
- Old entries (>1 hour) are automatically purged
- In production, consider using Redis for persistence across server restarts

### Suspicious Activity Detection

The system logs (but doesn't block) suspicious patterns:

- Bot-like user agents (`bot`, `crawler`, `spider`, `scraper`)
- Very short or empty user agents
- Known automation tools (`curl`, `wget`, `python`, `go-http-client`)

## Tuning Guidelines

### For High Traffic Sites

```bash
# Increase limits for rankings and events
RATE_LIMIT_RANKINGS_MAX=100
RATE_LIMIT_RANKINGS_BURST=30
RATE_LIMIT_EVENTS_MAX=50
RATE_LIMIT_EVENTS_BURST=15
```

### For Stricter Protection

```bash
# Reduce lead generation limits
RATE_LIMIT_LEAD_MAX=1
RATE_LIMIT_LEAD_BURST=0
RATE_LIMIT_LEAD_WINDOW_MS=300000  # 5 minutes

# Reduce rankings access
RATE_LIMIT_RANKINGS_MAX=10
RATE_LIMIT_RANKINGS_BURST=2
```

### For Development Testing

```bash
# Enable rate limiting in development
ENABLE_RATE_LIMITING=true

# Set very low limits for testing
RATE_LIMIT_LEAD_MAX=2
RATE_LIMIT_LEAD_WINDOW_MS=10000  # 10 seconds
```

## Safe Listing IPs

To bypass rate limiting for specific IPs or services:

```bash
# Single IP
RATE_LIMIT_SAFE_LIST=192.168.1.100

# Multiple IPs
RATE_LIMIT_SAFE_LIST=192.168.1.100,10.0.0.50,203.0.113.1

# Disable all rate limiting (not recommended)
RATE_LIMIT_SAFE_LIST=*
```

## Monitoring and Alerting

Monitor these metrics in your logging system:

- Rate limit violation frequency per endpoint
- IPs triggering suspicious activity detection
- Average request rates per endpoint
- 429 response rates

Example log patterns to watch:
```
Rate limit exceeded for lead from IP 203.0.113.1
Suspicious activity detected from IP 203.0.113.1: bot requesting /api/rankings
```

## Testing Rate Limits

Use the included unit tests to verify rate limiting logic:

```bash
npm test __tests__/rate-limiter.test.ts
```

For manual testing in development:

1. Set `ENABLE_RATE_LIMITING=true`
2. Set very low limits (e.g., `RATE_LIMIT_LEAD_MAX=1`)
3. Make multiple requests to trigger rate limiting
4. Verify 429 responses and proper headers

## Performance Considerations

- Rate limiting adds minimal overhead (~1ms per request)
- Memory usage is proportional to unique IP count
- Consider Redis for high-traffic deployments
- Edge middleware runs before route handlers, saving compute

## Security Notes

- Safe list IPs carefully to avoid bypass abuse
- Monitor suspicious activity logs for attack patterns
- Consider stricter limits during suspected attacks
- Rate limiting complements but doesn't replace other security measures