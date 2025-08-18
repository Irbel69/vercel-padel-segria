import { Platform } from "./platform-detection";

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Estado global del prompt de instalación
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installPromptListeners: ((available: boolean) => void)[] = [];

/**
 * Configura el listener para el evento beforeinstallprompt
 */
export function setupInstallPromptListener(): void {
  if (typeof window === "undefined") return;

  const handleBeforeInstallPrompt = (e: Event) => {
    console.log("🎯 beforeinstallprompt event captured");
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Notificar a todos los listeners que el prompt está disponible
    installPromptListeners.forEach(listener => listener(true));
  };

  const handleAppInstalled = () => {
    console.log("✅ PWA installed successfully");
    deferredPrompt = null;
    
    // Notificar que ya no está disponible el prompt
    installPromptListeners.forEach(listener => listener(false));
    
    // Limpiar localStorage de dismissals
    localStorage.removeItem("pwa-banner-dismissed");
    localStorage.removeItem("pwa-dismiss-count");
  };

  // Remover listeners existentes para evitar duplicados
  window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.removeEventListener("appinstalled", handleAppInstalled);
  
  // Añadir listeners
  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleAppInstalled);
}

/**
 * Suscribirse a cambios de disponibilidad del prompt de instalación
 */
export function onInstallPromptChange(callback: (available: boolean) => void): () => void {
  installPromptListeners.push(callback);
  
  // Llamar inmediatamente con el estado actual
  callback(!!deferredPrompt);
  
  // Retornar función de cleanup
  return () => {
    const index = installPromptListeners.indexOf(callback);
    if (index > -1) {
      installPromptListeners.splice(index, 1);
    }
  };
}

/**
 * Intenta triggear la instalación automática de la PWA
 */
export async function triggerInstall(): Promise<{ success: boolean; outcome?: string; error?: string }> {
  if (!deferredPrompt) {
    console.warn("❌ No deferred prompt available");
    return { success: false, error: "No prompt available" };
  }

  try {
    console.log("🚀 Triggering install prompt");
    await deferredPrompt.prompt();
    
    const choiceResult = await deferredPrompt.userChoice;
    console.log(`📊 User choice: ${choiceResult.outcome}`);
    
    if (choiceResult.outcome === "accepted") {
      deferredPrompt = null;
      installPromptListeners.forEach(listener => listener(false));
      return { success: true, outcome: "accepted" };
    } else {
      // Usuario rechazó, pero mantenemos el prompt para intentos futuros
      return { success: false, outcome: "dismissed" };
    }
  } catch (error) {
    console.error("❌ Error triggering install prompt:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Verifica si el prompt de instalación está disponible
 */
export function isInstallPromptAvailable(): boolean {
  return !!deferredPrompt;
}

/**
 * Gestión de dismissals del banner
 */
export interface DismissalState {
  isDismissed: boolean;
  dismissCount: number;
  lastDismissedAt?: Date;
  canShow: boolean;
}

export function getDismissalState(): DismissalState {
  const dismissed = localStorage.getItem("pwa-banner-dismissed");
  const dismissCountStr = localStorage.getItem("pwa-dismiss-count");
  const dismissCount = dismissCountStr ? parseInt(dismissCountStr, 10) : 0;
  
  if (dismissed) {
    const lastDismissedAt = new Date(dismissed);
    const daysSinceDismiss = (Date.now() - lastDismissedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Lógica de re-showing:
    // - Si se ha rechazado menos de 3 veces, mostrar después de 7 días
    // - Si se ha rechazado 3+ veces, mostrar después de 30 días
    const daysToWait = dismissCount < 3 ? 7 : 30;
    const canShow = daysSinceDismiss >= daysToWait;
    
    return {
      isDismissed: true,
      dismissCount,
      lastDismissedAt,
      canShow
    };
  }
  
  return {
    isDismissed: false,
    dismissCount,
    canShow: true
  };
}

export function dismissBanner(permanent: boolean = false): void {
  const dismissalState = getDismissalState();
  const newDismissCount = dismissalState.dismissCount + 1;
  
  localStorage.setItem("pwa-dismiss-count", newDismissCount.toString());
  
  if (permanent) {
    localStorage.setItem("pwa-banner-dismissed", new Date().toISOString());
    console.log(`📝 Banner dismissed permanently (count: ${newDismissCount})`);
  } else {
    // Dismissal temporal (solo para esta sesión)
    sessionStorage.setItem("pwa-banner-session-dismissed", "true");
    console.log("📝 Banner dismissed for this session");
  }
}

export function isSessionDismissed(): boolean {
  return sessionStorage.getItem("pwa-banner-session-dismissed") === "true";
}

/**
 * Abre Safari en iOS cuando el usuario está en otro navegador
 */
export function openInSafari(): void {
  const currentUrl = window.location.href;
  
  // Intenta abrir en Safari
  const safariUrl = currentUrl.replace(/^https?:\/\//, 'x-web-search://');
  window.location.href = safariUrl;
  
  // Fallback: mostrar instrucciones si no funciona
  setTimeout(() => {
    alert("Obre aquesta pàgina en Safari per poder instal·lar l'aplicació.");
  }, 1000);
}

/**
 * Genera URL para compartir en redes sociales
 */
export function getShareUrls(platform: Platform) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent("Descobreix Padel Segrià - La millor app per tornejos de pàdel!");
  
  return {
    whatsapp: `https://wa.me/?text=${text} ${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  };
}

/**
 * Función de logging unificada para debugging PWA
 */
export function logPWAEvent(event: string, data?: any): void {
  console.log(`🏓 PWA Event [${event}]:`, data);
  
  // En producción, podrías enviar a analytics aquí
  // analytics.track('PWA_Event', { event, ...data });
}