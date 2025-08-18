import { type NextRequest } from "next/server";
import { updateSession } from "@/libs/supabase/middleware";
import { applyRateLimit, detectSuspiciousActivity } from "@/libs/rate-limiter-middleware";

export async function middleware(request: NextRequest) {
  // Detect suspicious activity (log only, don't block)
  detectSuspiciousActivity(request);
  
  // Apply rate limiting - returns response if blocked, null if allowed
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  // Continue with auth middleware
  return await updateSession(request);
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
