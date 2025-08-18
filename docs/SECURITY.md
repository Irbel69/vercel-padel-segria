# Security headers and CSP (centralized in middleware)

Este documento explica cómo están implementadas las cabeceras de seguridad y la Content Security Policy (CSP) en la app (App Router, runtime Edge), cómo usar el nonce en scripts inline y cómo validar la configuración en local y producción.

## Resumen

- Fuente única de verdad: `middleware.ts` aplica TODAS las cabeceras y genera un nonce por petición.
- CSP estricta sin `'unsafe-inline'` en scripts; `'unsafe-eval'` solo en desarrollo; estilos permiten `'unsafe-inline'`.
- Orígenes permitidos para Supabase, Crisp, Google Fonts, Vercel e imágenes están listados explícitamente.
- El nonce se expone en el request header `x-nonce` para que los Server Components lo lean con `headers()`.

## Archivos clave

- `middleware.ts`: genera nonce (Edge‑safe), construye la CSP y añade cabeceras (CSP, Referrer-Policy, X-Content-Type-Options, X-Frame-Options, Permissions-Policy y HSTS en prod). Integra `updateSession` de Supabase.
- `libs/seo.tsx`: los `<script type="application/ld+json">` incluyen `nonce` obtenido desde `headers()`.
- `next.config.js`: no define cabeceras; solo dominios de imágenes. Evita duplicidad.

## Cómo usar el nonce en scripts inline

En un Server Component:

```tsx
import { headers } from "next/headers";

export default function MyPage() {
  const nonce = headers().get("x-nonce") ?? undefined;
  return (
    <>
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: "console.log('inline ok')" }}
      />
    </>
  );
}
```

## CSP por entorno

- Desarrollo:
  - `script-src` incluye `'unsafe-eval'` para herramientas dev.
  - Se permiten `localhost:*` en `connect-src` e `img-src` donde aplica.
  - No se permite `'unsafe-inline'` en scripts; usa el `nonce`.
- Producción:
  - Sin `'unsafe-eval'` ni `'unsafe-inline'` en scripts.
  - HSTS activo.

## Orígenes permitidos (extracto)

- Supabase: `${NEXT_PUBLIC_SUPABASE_URL}` (https y wss)
- Crisp: `https://client.crisp.chat/`, `https://settings.crisp.chat/`, `https://widget.crisp.chat/`, `wss://client.crisp.chat/`
- Google Fonts: `https://fonts.googleapis.com/`, `https://fonts.gstatic.com/`
- Vercel: `https://vercel.live/`, `https://vitals.vercel-insights.com/`
- Imágenes: `lh3.googleusercontent.com`, `pbs.twimg.com`, `images.unsplash.com`, `logos-world.net` (ver también `next.config.js`)

## Validación y pruebas

- Local (script de seguridad):

```powershell
npm run test:security
```

- Jest (suite completa):

```powershell
npm test
```

- Producción:
  - Mozilla Observatory: https://observatory.mozilla.org/ (objetivo A/A+)
  - Lighthouse (DevTools) apartado Security
  - Revisar consola por violaciones CSP

## Solución de problemas comunes

- Violaciones CSP al integrar un tercero: añade su dominio en la función `buildCSP` de `middleware.ts` en la directiva adecuada.
- Script inline no ejecuta: asegura que le pasas `nonce` leído con `headers()`.
- Imágenes bloqueadas: añade el dominio en `next.config.js` (images.domains) y en `img-src` de la CSP.
- Problemas en dev: confirma `NODE_ENV=development`.

## Notas

- Se eliminó el archivo legado `lib/security.ts`. No es necesario; toda la lógica vive en `middleware.ts`.