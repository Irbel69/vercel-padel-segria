import { Platform } from "./platform-detection";

export interface InstallInstruction {
  title: string;
  steps: Array<{
    text: string;
    icon?: string;
    description?: string;
  }>;
  note?: string;
  videoUrl?: string;
}

/**
 * Obtiene las instrucciones de instalación específicas para cada plataforma
 */
export function getInstallInstructions(platform: Platform, browserName: string): InstallInstruction {
  switch (platform) {
    case "ios-safari":
      return {
        title: "Com instal·lar en Safari (iOS)",
        steps: [
          {
            text: "Toca la icona de compartir",
            icon: "Share",
            description: "Busca la icona amb una fletxa cap amunt a la part inferior de la pantalla"
          },
          {
            text: "Selecciona 'Afegir a l'inici'",
            icon: "Plus",
            description: "Desplaça't cap avall si no la veus immediatament"
          },
          {
            text: "Confirma tocant 'Afegir'",
            icon: "Check",
            description: "Apareixerà a la part superior dreta de la pantalla"
          }
        ],
        note: "L'aplicació apareixerà a la pantalla d'inici del teu iPhone/iPad com una app nativa"
      };

    case "ios-other":
      return {
        title: `Cal obrir en Safari per instal·lar`,
        steps: [
          {
            text: "Toca 'Obre en Safari'",
            icon: "ExternalLink",
            description: "El botó apareixerà a continuació"
          },
          {
            text: "Quan s'obri Safari, toca compartir",
            icon: "Share",
            description: "Icona amb fletxa cap amunt a la part inferior"
          },
          {
            text: "Selecciona 'Afegir a l'inici'",
            icon: "Plus",
            description: "I després confirma amb 'Afegir'"
          }
        ],
        note: "Només Safari pot instal·lar aplicacions web en iOS"
      };

    case "android-chromium":
      return {
        title: `Com instal·lar en ${browserName}`,
        steps: [
          {
            text: "Toca el botó 'Instal·lar'",
            icon: "Download",
            description: "Si apareix automàticament, només cal que el toquis"
          },
          {
            text: "O obre el menú del navegador",
            icon: "MoreVertical",
            description: "Tres punts verticals, normalment a dalt a la dreta"
          },
          {
            text: "Selecciona 'Instal·lar app' o 'Afegir a l'inici'",
            icon: "Smartphone",
            description: "El text pot variar segons la versió del navegador"
          }
        ],
        note: "L'app s'instal·larà automàticament i apareixerà al calaix d'aplicacions"
      };

    case "android-firefox":
      return {
        title: "Com instal·lar en Firefox (Android)",
        steps: [
          {
            text: "Toca el menú de Firefox",
            icon: "Menu",
            description: "Tres línies horitzontals, normalment a la part inferior dreta"
          },
          {
            text: "Selecciona 'Instal·lar'",
            icon: "Download",
            description: "Si no veus aquesta opció, busca 'Afegir a la pantalla d'inici'"
          },
          {
            text: "Confirma la instal·lació",
            icon: "Check",
            description: "L'app apareixerà al teu calaix d'aplicacions"
          }
        ],
        note: "Firefox pot trigar uns segons a mostrar l'opció d'instal·lació"
      };

    case "android-samsung":
      return {
        title: "Com instal·lar en Samsung Internet",
        steps: [
          {
            text: "Toca el botó 'Instal·lar' si apareix",
            icon: "Download",
            description: "Samsung Internet sol mostrar un prompt automàtic"
          },
          {
            text: "O obre el menú del navegador",
            icon: "Menu",
            description: "Tres línies horitzontals a la part inferior"
          },
          {
            text: "Selecciona 'Afegir pàgina a' > 'Pantalla d'inici'",
            icon: "Smartphone",
            description: "També pot aparèixer com 'Instal·lar app'"
          }
        ],
        note: "Samsung Internet té excel·lent suport per a aplicacions web"
      };

    case "android-other":
      return {
        title: `Com instal·lar en ${browserName}`,
        steps: [
          {
            text: "Obre el menú del navegador",
            icon: "MoreVertical",
            description: "Normalment tres punts o línies"
          },
          {
            text: "Busca 'Afegir a l'inici' o 'Instal·lar'",
            icon: "Search",
            description: "El text exacte pot variar"
          },
          {
            text: "Confirma la instal·lació",
            icon: "Check",
            description: "L'app apareixerà al calaix d'aplicacions"
          }
        ],
        note: "Si no trobes l'opció, prova a obrir la pàgina en Chrome"
      };

    case "desktop-chromium":
      return {
        title: `Com instal·lar en ${browserName} (Desktop)`,
        steps: [
          {
            text: "Toca la icona d'instal·lació",
            icon: "Download",
            description: "Apareix a la barra d'adreces (icona + o descàrrega)"
          },
          {
            text: "O obre el menú del navegador",
            icon: "MoreVertical",
            description: "Tres punts a la cantonada superior dreta"
          },
          {
            text: "Selecciona 'Instal·lar Padel Segrià'",
            icon: "Monitor",
            description: "L'app apareixerà com una aplicació independent"
          }
        ],
        note: "Podràs accedir a l'app des del menú d'inici o escriptori"
      };

    case "desktop-firefox":
      return {
        title: "Instal·lació en Firefox (Desktop)",
        steps: [
          {
            text: "Firefox té suport limitat per PWA",
            icon: "Info",
            description: "Pots afegir un accés directe manualment"
          },
          {
            text: "Afegeix als marcadors",
            icon: "Bookmark",
            description: "Ctrl+D o Cmd+D per crear un marcador"
          },
          {
            text: "Crea un accés directe a l'escriptori",
            icon: "Monitor",
            description: "Arrossega el marcador a l'escriptori"
          }
        ],
        note: "Per a millor experiència, recomanen usar Chrome o Edge"
      };

    case "desktop-safari":
      return {
        title: "Safari (macOS) no suporta PWA",
        steps: [
          {
            text: "Safari no pot instal·lar aplicacions web",
            icon: "X",
            description: "És una limitació del navegador"
          },
          {
            text: "Afegeix als marcadors",
            icon: "Bookmark",
            description: "Cmd+D per crear un marcador ràpid"
          },
          {
            text: "O prova Chrome/Edge per instal·lar",
            icon: "Download",
            description: "Aquests navegadors sí suporten PWA"
          }
        ],
        note: "Recomanen usar Chrome o Edge en Mac per a aplicacions web"
      };

    default:
      return {
        title: "Com instal·lar l'aplicació",
        steps: [
          {
            text: "Busca l'opció d'instal·lació",
            icon: "Search",
            description: "Al menú del navegador o barra d'adreces"
          },
          {
            text: "Selecciona 'Instal·lar' o 'Afegir a l'inici'",
            icon: "Download",
            description: "El text pot variar segons el navegador"
          },
          {
            text: "Confirma la instal·lació",
            icon: "Check",
            description: "L'app apareixerà al dispositiu"
          }
        ],
        note: "Si tens problemes, prova amb Chrome o Edge"
      };
  }
}

/**
 * Obtiene textos de promoción específicos para cada plataforma
 */
export function getPromotionTexts(platform: Platform, canAutoInstall: boolean) {
  const baseTexts = {
  title: "Instal·la Padel Segrià",
    subtitle: "Accés ràpid i experiència nativa"
  };

  switch (platform) {
    case "ios-safari":
      return {
        ...baseTexts,
        description: "Afegeix l'app a la pantalla d'inici per accedir ràpidament als teus tornejos",
        primaryButton: "Com instal·lar",
        secondaryButton: "Més tard"
      };

    case "ios-other":
      return {
        ...baseTexts,
        description: "Obre en Safari per poder instal·lar l'aplicació al teu iPhone",
        primaryButton: "Obre en Safari",
        secondaryButton: "No, gràcies"
      };

    case "android-chromium":
      if (canAutoInstall) {
        return {
          ...baseTexts,
          description: "Instal·la l'app amb un sol toc per a una experiència millor",
          primaryButton: "Instal·lar ara",
          secondaryButton: "Més tard"
        };
      } else {
        return {
          ...baseTexts,
          description: "Afegeix l'app al teu telèfon per accedir ràpidament",
          primaryButton: "Com instal·lar",
          secondaryButton: "Més tard"
        };
      }

    case "android-firefox":
    case "android-samsung":
    case "android-other":
      return {
        ...baseTexts,
        description: "Afegeix l'app al teu Android per un accés més ràpid",
        primaryButton: "Com instal·lar",
        secondaryButton: "Més tard"
      };

    case "desktop-chromium":
      return {
        ...baseTexts,
  title: "Instal·la Padel Segrià al teu ordinador",
        description: "Aconsegueix una aplicació independent per gestionar els teus tornejos",
        primaryButton: canAutoInstall ? "Instal·lar ara" : "Com instal·lar",
        secondaryButton: "Més tard"
      };

    case "desktop-firefox":
    case "desktop-safari":
      return {
        ...baseTexts,
  title: "Afegeix Padel Segrià als marcadors",
        description: "Crea un accés ràpid a l'aplicació des del teu navegador",
        primaryButton: "Com fer-ho",
        secondaryButton: "Més tard"
      };

    default:
      return {
        ...baseTexts,
        description: "Afegeix l'aplicació al teu dispositiu per un accés més ràpid",
        primaryButton: "Com instal·lar",
        secondaryButton: "Més tard"
      };
  }
}