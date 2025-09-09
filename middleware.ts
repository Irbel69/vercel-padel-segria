import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/libs/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Handle Supabase session first
  const sessionResponse = await updateSession(request);
  
  // Edge-safe nonce generator (base64url)
  function genNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Convert to base64url without Buffer
    let str = "";
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    const b64 = btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return b64;
  }

  // Build a strict CSP string tailored to our stack
  function buildCSP(nonce: string) {
    const isDev = process.env.NODE_ENV !== "production";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    // Derive hosts
    const supabaseHost = (() => {
      try {
        if (!supabaseUrl) return null;
        return new URL(supabaseUrl).host; // e.g. abcd.supabase.co
      } catch {
        return null;
      }
    })();

    const scriptSrc = [
      "'self'",
      `'nonce-${nonce}'`,
      isDev ? "'unsafe-eval'" : null, // ONLY in dev
      // During development allow unsafe-inline to avoid blocking dev-only inlined scripts
      isDev ? "'unsafe-inline'" : null,
      // Allow Vercel analytics script origin (used in dev/debug) as an explicit host
      "https://va.vercel-scripts.com",
    ].filter(Boolean).join(" ");

    const styleSrc = [
      "'self'",
      "'unsafe-inline'", // acceptable for styles
      "https://fonts.googleapis.com/",
    ].join(" ");

    const scriptSrcElem = [
      "'self'",
      `'nonce-${nonce}'`,
      // Allow a known small inline bootstrap script by hash (Next.js may inline minimal boot code)
      "'sha256-L48vfNqEGvfFx/QBzIwyw4BwkFQlmhv4qUdPeVuAdOc='",
      // Allow Vercel analytics script element
      "https://va.vercel-scripts.com",
      // During development, allow inline scripts to avoid blocking dev-only inlined tooling
      isDev ? "'unsafe-inline'" : null,
    ].join(" ");

    const imgSrc = [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://lh3.googleusercontent.com/",
      "https://pbs.twimg.com/",
      "https://images.unsplash.com/",
      "https://logos-world.net/",
  // Crisp domains removed
    ];

    const connectSrc = [
      "'self'",
      "https:",
      "wss:",
      "https://vercel.live/",
      "https://vitals.vercel-insights.com/",
      "https://api.resend.com/",
  // Crisp domains removed
    ];

    if (supabaseHost) {
      connectSrc.push(`https://${supabaseHost}`, `wss://${supabaseHost}`);
      imgSrc.push(`https://${supabaseHost}`);
    }

    if (isDev) {
      connectSrc.push("http://localhost:*", "ws://localhost:*");
      imgSrc.push("http://localhost:*");
    }

    const directives = [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `script-src-elem ${scriptSrcElem}`,
      `style-src ${styleSrc}`,
      `style-src-elem ${styleSrc}`,
  `font-src 'self' data: https://fonts.gstatic.com/`,
      `img-src ${imgSrc.join(" ")}`,
      `connect-src ${connectSrc.join(" ")}`,
  `frame-src 'self'`,
      `worker-src 'self' blob:`,
      `child-src 'self' blob:`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
    ];

    return directives.join("; ");
  }

  // Generate per-request nonce and propagate to request headers so Server Components can read it
  const nonce = genNonce();
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-nonce", nonce);

  // First, let Supabase update the session (may return a redirect and set cookies)
  const supabaseResponse = sessionResponse;

  // If Supabase triggers a redirect, attach security headers and return it
  if (supabaseResponse.redirected || (supabaseResponse.status >= 300 && supabaseResponse.status < 400)) {
    const csp = buildCSP(nonce);
    supabaseResponse.headers.set("Content-Security-Policy", csp);
    supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
    supabaseResponse.headers.set("X-Frame-Options", "DENY");
    supabaseResponse.headers.set("Permissions-Policy", "browsing-topics=()");
    // HSTS only in production
    if (process.env.NODE_ENV === "production") {
      supabaseResponse.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    // Propagate nonce for potential downstream use (only in non-production to avoid leaking it)
    if (process.env.NODE_ENV !== "production") {
      supabaseResponse.headers.set("x-nonce", nonce);
    }
    return supabaseResponse;
  }

  // Normal flow: create a fresh NextResponse with overridden request headers (to expose nonce)
  const response = NextResponse.next({ request: { headers: reqHeaders } });

  // Merge cookies set by Supabase into our response
  try {
    const cookies = supabaseResponse.cookies.getAll();
    for (const c of cookies) {
      response.cookies.set(c);
    }
  } catch {
    // ignore if API differs
  }

  // Apply security headers
  const csp = buildCSP(nonce);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "browsing-topics=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  // Also expose nonce on the response for debugging
  if (process.env.NODE_ENV !== "production") {
    response.headers.set("x-nonce", nonce);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
