/**
 * Utilities for debugging and testing PWA functionality
 */

import { detectPlatform, isStandalone } from "./platform-detection";
import { getDismissalState, isSessionDismissed } from "./pwa-utils";

export interface PWADebugInfo {
  platform: ReturnType<typeof detectPlatform>;
  isStandalone: boolean;
  userAgent: string;
  dismissalState: ReturnType<typeof getDismissalState>;
  sessionDismissed: boolean;
  supportedFeatures: {
    beforeinstallprompt: boolean;
    serviceWorker: boolean;
    manifest: boolean;
    storage: boolean;
  };
  mediaQueries: {
    standalone: boolean;
    minimalUI: boolean;
    fullscreen: boolean;
    mobile: boolean;
  };
}

/**
 * Recopila información completa de debug sobre PWA
 */
export function getPWADebugInfo(): PWADebugInfo {
  const platform = detectPlatform();
  const dismissalState = getDismissalState();
  
  return {
    platform,
    isStandalone: isStandalone(),
    userAgent: navigator.userAgent,
    dismissalState,
    sessionDismissed: isSessionDismissed(),
    supportedFeatures: {
      beforeinstallprompt: 'BeforeInstallPromptEvent' in window,
      serviceWorker: 'serviceWorker' in navigator,
      manifest: 'getManifest' in window || document.querySelector('link[rel="manifest"]') !== null,
      storage: 'storage' in navigator
    },
    mediaQueries: {
      standalone: window.matchMedia?.('(display-mode: standalone)').matches || false,
      minimalUI: window.matchMedia?.('(display-mode: minimal-ui)').matches || false,
      fullscreen: window.matchMedia?.('(display-mode: fullscreen)').matches || false,
      mobile: window.matchMedia?.('(max-width: 768px)').matches || false
    }
  };
}

/**
 * Muestra información de debug en consola
 */
export function logPWADebugInfo(): void {
  const debugInfo = getPWADebugInfo();
  
  console.group('🏓 PWA Debug Information');
  console.log('📱 Platform:', debugInfo.platform);
  console.log('🏠 Is Standalone:', debugInfo.isStandalone);
  console.log('🌐 User Agent:', debugInfo.userAgent);
  console.log('❌ Dismissal State:', debugInfo.dismissalState);
  console.log('💾 Session Dismissed:', debugInfo.sessionDismissed);
  console.log('⚡ Supported Features:', debugInfo.supportedFeatures);
  console.log('📺 Media Queries:', debugInfo.mediaQueries);
  console.groupEnd();
}

/**
 * Test helper para simular diferentes plataformas
 */
export function simulatePlatform(userAgent: string): void {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    configurable: true
  });
  
  console.log(`🎭 Simulating platform with UA: ${userAgent}`);
  logPWADebugInfo();
}

/**
 * Test helpers para diferentes dispositivos
 */
export const testUserAgents = {
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  iosChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/94.0.4606.76 Mobile/15E148 Safari/604.1',
  androidChrome: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.85 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Mobile; rv:94.0) Gecko/94.0 Firefox/94.0',
  androidSamsung: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/15.0 Chrome/94.0.4606.85 Mobile Safari/537.36',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.85 Safari/537.36',
  desktopSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
};

/**
 * Limpia el estado de dismissal para testing
 */
export function clearPWAState(): void {
  localStorage.removeItem('pwa-banner-dismissed');
  localStorage.removeItem('pwa-dismiss-count');
  sessionStorage.removeItem('pwa-banner-session-dismissed');
  console.log('🧹 PWA state cleared');
}

/**
 * Función para exponer en window para debugging en producción
 */
export function exposePWADebug(): void {
  if (typeof window !== 'undefined') {
    (window as any).pwaDebug = {
      getInfo: getPWADebugInfo,
      log: logPWADebugInfo,
      simulate: simulatePlatform,
      testUA: testUserAgents,
      clear: clearPWAState
    };
    
    console.log('🔧 PWA Debug tools available at window.pwaDebug');
  }
}