import { NextResponse } from 'next/server';

// Security configuration per environment
interface SecurityConfig {
  isDevelopment: boolean;
  domain: string;
  supabaseUrl?: string;
}

// Generate a random nonce for CSP
export function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

// Create Content Security Policy
export function createCSP(config: SecurityConfig, nonce?: string): string {
  const { isDevelopment, supabaseUrl } = config;
  
  // Base CSP directives
  const cspDirectives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js development and React DevTools
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      'https://vercel.live/', // Vercel analytics
      'https://va.vercel-scripts.com/', // Vercel analytics
      'https://client.crisp.chat/', // Crisp chat
      'https://settings.crisp.chat/', // Crisp settings
    ],
    'script-src-elem': [
      "'self'",
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      'https://client.crisp.chat/',
      'https://settings.crisp.chat/',
      'https://widget.crisp.chat/',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for CSS-in-JS and styled-components
      'https://fonts.googleapis.com/',
      'https://client.crisp.chat/',
    ],
    'style-src-elem': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com/',
      'https://client.crisp.chat/',
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com/',
      'https://client.crisp.chat/',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      ...(supabaseUrl ? [`${supabaseUrl.replace('https://', 'https://*.')}`] : []),
      'https://lh3.googleusercontent.com/',
      'https://pbs.twimg.com/',
      'https://images.unsplash.com/',
      'https://logos-world.net/',
      'https://client.crisp.chat/',
      'https://image.crisp.chat/',
      'https://storage.crisp.chat/',
    ],
    'connect-src': [
      "'self'",
      ...(supabaseUrl ? [supabaseUrl, `wss://${supabaseUrl.replace('https://', '')}/realtime/v1/websocket?vsn=1.0.0`] : []),
      'https://vercel.live/',
      'https://vitals.vercel-insights.com/',
      'https://api.resend.com/',
      'https://client.crisp.chat/',
      'https://settings.crisp.chat/',
      'wss://client.crisp.chat/',
    ],
    'frame-src': [
      "'self'",
      'https://client.crisp.chat/',
    ],
    'worker-src': [
      "'self'",
      'blob:',
    ],
    'child-src': [
      "'self'",
      'blob:',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'media-src': [
      "'self'",
      'https://client.crisp.chat/',
      'https://storage.crisp.chat/',
    ],
  };

  // Development specific adjustments
  if (isDevelopment) {
    cspDirectives['script-src'].push(
      "'unsafe-inline'", // Required for Next.js dev server
      'http://localhost:*',
      'https://localhost:*',
      'ws://localhost:*',
      'wss://localhost:*'
    );
    cspDirectives['connect-src'].push(
      'http://localhost:*',
      'https://localhost:*',
      'ws://localhost:*',
      'wss://localhost:*',
      'webpack://*' // Webpack dev server
    );
    cspDirectives['img-src'].push('http://localhost:*');
  }

  // Convert to CSP string
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

// Apply security headers to response
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityConfig,
  nonce?: string
): NextResponse {
  const { isDevelopment, domain } = config;

  // Content Security Policy
  const csp = createCSP(config, nonce);
  response.headers.set('Content-Security-Policy', csp);

  // X-Frame-Options (prevent clickjacking)
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options (prevent MIME sniffing)
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (restrict browser features)
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()', // Disable FLoC
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
    'clipboard-read=()',
    'clipboard-write=(self)',
  ].join(', ');
  response.headers.set('Permissions-Policy', permissionsPolicy);

  // Cross-Origin policies
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

  // Strict Transport Security (only for HTTPS/production)
  if (!isDevelopment && (domain.includes('https') || process.env.NODE_ENV === 'production')) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-DNS-Prefetch-Control
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

// Get security configuration based on environment
export function getSecurityConfig(): SecurityConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const domain = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return {
    isDevelopment,
    domain,
    supabaseUrl,
  };
}