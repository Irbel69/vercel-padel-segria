"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Smartphone, 
  Plus, 
  Download, 
  Share, 
  MoreVertical, 
  ExternalLink, 
  Menu,
  Monitor,
  Info,
  Bookmark,
  Check,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  detectPlatform, 
  isStandalone, 
  isMobileDevice,
  type PlatformInfo 
} from "@/lib/platform-detection";
import {
  setupInstallPromptListener,
  onInstallPromptChange,
  triggerInstall,
  getDismissalState,
  dismissBanner,
  isSessionDismissed,
  openInSafari,
  logPWAEvent
} from "@/lib/pwa-utils";
import { 
  getInstallInstructions, 
  getPromotionTexts 
} from "@/lib/install-instructions";
import { exposePWADebug } from "@/lib/pwa-debug";

// Iconos dinámicos basados en strings
const iconMap = {
  Share,
  Plus,
  Download,
  MoreVertical,
  ExternalLink,
  Menu,
  Monitor,
  Info,
  Bookmark,
  Check,
  Search,
  X
};

const AddToHomeScreen = () => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [canAutoInstall, setCanAutoInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Exponer herramientas de debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      exposePWADebug();
    }

    // Configurar detección de plataforma
    const platform = detectPlatform();
    setPlatformInfo(platform);
    logPWAEvent("Platform Detected", platform);

    // No mostrar en desktop o si ya está instalada
    if (isStandalone()) {
      logPWAEvent("Already Installed", { platform: platform.platform });
      return;
    }

    // Configurar listener para beforeinstallprompt
    setupInstallPromptListener();
    
    const cleanup = onInstallPromptChange((available) => {
      setCanAutoInstall(available);
      logPWAEvent("Install Prompt Available", { available, platform: platform.platform });
    });

    // Verificar estado de dismissal
    const dismissalState = getDismissalState();
    const sessionDismissed = isSessionDismissed();
    
    if (!dismissalState.canShow || sessionDismissed) {
      logPWAEvent("Banner Dismissed", { dismissalState, sessionDismissed });
      return;
    }

    // Mostrar banner después de un delay
    const delay = platform.platform === "ios-safari" ? 2000 : 
                  platform.canAutoInstall ? 3000 : 4000;
    
    const timer = setTimeout(() => {
      setShowBanner(true);
      logPWAEvent("Banner Shown", { platform: platform.platform, delay });
    }, delay);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  const handleInstallClick = async () => {
    if (!platformInfo) return;

    logPWAEvent("Install Button Clicked", { 
      platform: platformInfo.platform,
      canAutoInstall: platformInfo.canAutoInstall && canAutoInstall 
    });

    if (platformInfo.canAutoInstall && canAutoInstall) {
      // Instalación automática (Android Chrome/Edge)
      setIsInstalling(true);
      const result = await triggerInstall();
      setIsInstalling(false);

      if (result.success && result.outcome === "accepted") {
        setShowBanner(false);
        logPWAEvent("Install Successful", { platform: platformInfo.platform });
      } else {
        logPWAEvent("Install Failed", { 
          platform: platformInfo.platform, 
          error: result.error,
          outcome: result.outcome 
        });
        
        if (result.outcome === "dismissed") {
          // Usuario rechazó, mostrar instrucciones como fallback
          setShowInstructions(true);
        }
      }
    } else if (platformInfo.needsSafari) {
      // iOS navegadores alternativos - abrir en Safari
      openInSafari();
      logPWAEvent("Redirected to Safari", { platform: platformInfo.platform });
    } else {
      // Mostrar instrucciones manuales
      setShowInstructions(true);
      logPWAEvent("Instructions Shown", { platform: platformInfo.platform });
    }
  };

  const handleDismiss = (permanent: boolean = false) => {
    dismissBanner(permanent);
    setShowBanner(false);
    setShowInstructions(false);
    logPWAEvent("Banner Dismissed", { 
      permanent, 
      platform: platformInfo?.platform 
    });
  };

  const handleRemindLater = () => {
    dismissBanner(false); // Solo para esta sesión
    setShowBanner(false);
    setShowInstructions(false);
    logPWAEvent("Remind Later", { platform: platformInfo?.platform });
  };

  // No mostrar si no hay plataforma detectada, ya está instalada, o banner no debe mostrarse
  if (!platformInfo || isStandalone() || !showBanner) {
    return null;
  }

  const promotionTexts = getPromotionTexts(
    platformInfo.platform, 
    platformInfo.canAutoInstall && canAutoInstall
  );
  const instructions = getInstallInstructions(
    platformInfo.platform, 
    platformInfo.browserName
  );

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      {!showInstructions ? (
        // Main install banner
        <Card className="bg-gradient-to-r from-padel-primary/20 to-padel-primary/10 border-padel-primary/30 shadow-2xl backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-padel-primary/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-padel-primary" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white mb-1">
                  {promotionTexts.title}
                </h3>
                <p className="text-xs text-white/80 mb-3">
                  {promotionTexts.description}
                </p>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleInstallClick}
                    disabled={isInstalling}
                    size="sm"
                    className="bg-padel-primary text-black hover:bg-padel-primary/90 font-medium flex items-center space-x-1"
                  >
                    {isInstalling ? (
                      <>
                        <div className="w-3 h-3 border border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Instal·lant...</span>
                      </>
                    ) : platformInfo.canAutoInstall && canAutoInstall ? (
                      <>
                        <Download className="w-3 h-3" />
                        <span>{promotionTexts.primaryButton}</span>
                      </>
                    ) : platformInfo.needsSafari ? (
                      <>
                        <ExternalLink className="w-3 h-3" />
                        <span>{promotionTexts.primaryButton}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>{promotionTexts.primaryButton}</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRemindLater}
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    {promotionTexts.secondaryButton}
                  </Button>
                </div>
              </div>
              
              <button
                onClick={() => handleDismiss(true)}
                className="flex-shrink-0 p-1 text-white/50 hover:text-white/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Detailed instructions modal
        <Card className="bg-gradient-to-r from-padel-primary/25 to-padel-primary/15 border-padel-primary/40 shadow-2xl backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {instructions.title}
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 text-white/50 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {instructions.steps.map((step, index) => {
                const IconComponent = step.icon ? iconMap[step.icon as keyof typeof iconMap] : Plus;
                
                return (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 bg-padel-primary/30 rounded-full flex items-center justify-center text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-white">{step.text}</span>
                        {IconComponent && (
                          <div className="w-5 h-5 border border-white/40 rounded flex items-center justify-center">
                            <IconComponent className="w-3 h-3 text-white/70" />
                          </div>
                        )}
                      </div>
                      {step.description && (
                        <p className="text-xs text-white/60">{step.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {instructions.note && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/70 text-center">
                  {instructions.note}
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center space-x-2">
              <Button
                onClick={() => handleDismiss(true)}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Entesos, no tornis a mostrar-ho
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddToHomeScreen;