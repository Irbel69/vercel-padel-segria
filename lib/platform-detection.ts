// Tipos de plataforma que soportamos
export type Platform =
  | "ios-safari"        // iOS Safari - puede instalar PWA
  | "ios-other"         // iOS Chrome/Edge/Firefox - necesita abrir en Safari
  | "android-chromium"  // Android Chrome/Edge/Brave - soporta beforeinstallprompt
  | "android-firefox"   // Android Firefox - instalación manual
  | "android-samsung"   // Samsung Internet - híbrido
  | "android-other"     // Otros navegadores Android
  | "desktop-chromium"  // Desktop Chrome/Edge - soporta PWA
  | "desktop-safari"    // Desktop Safari - no soporta PWA
  | "desktop-firefox"   // Desktop Firefox - soporte limitado
  | "unknown";          // Navegador no identificado

export interface PlatformInfo {
  platform: Platform;
  canAutoInstall: boolean;    // Puede triggear prompt automático
  canManualInstall: boolean;  // Puede instalar manualmente
  needsSafari: boolean;       // Necesita abrir en Safari
  isDesktop: boolean;         // Es dispositivo desktop
  browserName: string;        // Nombre del navegador para mostrar
}

/**
 * Detecta la plataforma y navegador del usuario de forma robusta
 */
export function detectPlatform(): PlatformInfo {
  const ua = navigator.userAgent || "";
  const isIOS = /iP(hone|ad|od)/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Mobi|Android/i.test(ua);
  
  // Detección específica de navegadores
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Edg|EdgiOS|EdgA/i.test(ua);
  const isEdge = /Edg|EdgiOS|EdgA/i.test(ua);
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  const isBrave = /Brave/i.test(ua);
  const isOpera = /OPR|Opera/i.test(ua);
  
  // Detección más robusta de Chromium usando Client Hints si están disponibles
  const isChromiumLike = 
    (navigator as any).userAgentData?.brands?.some((b: any) =>
      /Chrom(e|ium)|Edge/i.test(b.brand)
    ) || 
    /Chrome|CriOS|Edg|EdgiOS|EdgA|Brave|OPR/i.test(ua);

  console.log("🔍 Platform Detection:", {
    ua,
    isIOS,
    isAndroid,
    isMobile,
    isSafari,
    isChrome,
    isEdge,
    isFirefox,
    isSamsung,
    isChromiumLike
  });

  // iOS Detection
  if (isIOS) {
    if (isSafari) {
      return {
        platform: "ios-safari",
        canAutoInstall: false,
        canManualInstall: true,
        needsSafari: false,
        isDesktop: false,
        browserName: "Safari iOS"
      };
    } else {
      const browserName = isChrome ? "Chrome iOS" : 
                         isEdge ? "Edge iOS" :
                         isFirefox ? "Firefox iOS" : "Navegador iOS";
      return {
        platform: "ios-other",
        canAutoInstall: false,
        canManualInstall: false,
        needsSafari: true,
        isDesktop: false,
        browserName
      };
    }
  }

  // Android Detection
  if (isAndroid) {
    if (isSamsung) {
      return {
        platform: "android-samsung",
        canAutoInstall: true, // Puede tener beforeinstallprompt
        canManualInstall: true,
        needsSafari: false,
        isDesktop: false,
        browserName: "Samsung Internet"
      };
    } else if (isFirefox) {
      return {
        platform: "android-firefox",
        canAutoInstall: false,
        canManualInstall: true,
        needsSafari: false,
        isDesktop: false,
        browserName: "Firefox Android"
      };
    } else if (isChromiumLike) {
      const browserName = isChrome ? "Chrome Android" :
                         isEdge ? "Edge Android" :
                         isBrave ? "Brave Android" :
                         isOpera ? "Opera Android" : "Navegador Android";
      return {
        platform: "android-chromium",
        canAutoInstall: true,
        canManualInstall: true,
        needsSafari: false,
        isDesktop: false,
        browserName
      };
    } else {
      return {
        platform: "android-other",
        canAutoInstall: false,
        canManualInstall: true,
        needsSafari: false,
        isDesktop: false,
        browserName: "Navegador Android"
      };
    }
  }

  // Desktop Detection
  if (!isMobile) {
    if (isSafari) {
      return {
        platform: "desktop-safari",
        canAutoInstall: false,
        canManualInstall: false,
        needsSafari: false,
        isDesktop: true,
        browserName: "Safari Desktop"
      };
    } else if (isChromiumLike) {
      const browserName = isChrome ? "Chrome Desktop" :
                         isEdge ? "Edge Desktop" :
                         isBrave ? "Brave Desktop" :
                         isOpera ? "Opera Desktop" : "Navegador Desktop";
      return {
        platform: "desktop-chromium",
        canAutoInstall: true,
        canManualInstall: true,
        needsSafari: false,
        isDesktop: true,
        browserName
      };
    } else if (isFirefox) {
      return {
        platform: "desktop-firefox",
        canAutoInstall: false,
        canManualInstall: true,
        needsSafari: false,
        isDesktop: true,
        browserName: "Firefox Desktop"
      };
    }
  }

  // Fallback para navegadores no identificados
  return {
    platform: "unknown",
    canAutoInstall: false,
    canManualInstall: true,
    needsSafari: false,
    isDesktop: !isMobile,
    browserName: "Navegador desconocido"
  };
}

/**
 * Verifica si la aplicación ya está instalada (modo standalone)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS PWA legacy detection
    (window as any).navigator?.standalone === true ||
    // Check for other display modes that indicate installed PWA
    window.matchMedia?.("(display-mode: minimal-ui)").matches ||
    window.matchMedia?.("(display-mode: fullscreen)").matches
  );
}

/**
 * Verifica si es un dispositivo móvil
 */
export function isMobileDevice(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Verifica si el navegador está en modo incógnito/privado
 * Nota: Esta detección no es 100% fiable en todos los navegadores
 */
export async function isPrivateMode(): Promise<boolean> {
  try {
    // Test para Chrome/Edge
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.quota && estimate.quota < 120000000; // < 120MB típicamente indica modo privado
    }
    
    // Test para Safari
    try {
      localStorage.setItem('test', '1');
      localStorage.removeItem('test');
      return false;
    } catch {
      return true;
    }
  } catch {
    return false;
  }
}