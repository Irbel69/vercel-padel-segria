import { headers } from 'next/headers';

/**
 * Get the nonce from the request headers
 * This is set by the middleware and can be used for inline scripts
 */
export function getNonce(): string | undefined {
  try {
    const headersList = headers();
    return headersList.get('x-nonce') || undefined;
  } catch {
    // In case headers() is not available (e.g., during build)
    return undefined;
  }
}

/**
 * Create a script tag with nonce for CSP compliance
 */
export function createNonceScript(content: string, nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<script${nonceAttr}>${content}</script>`;
}

/**
 * Get CSP meta tag for pages that need it
 */
export function getCSPMetaTag(nonce?: string): string {
  // This can be used for additional CSP configuration if needed
  return '';
}