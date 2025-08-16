# Arquitectura y Flujo del Dashboard

Última actualización: 2025-08-16

Este documento explica la estructura del dashboard, cómo se gestionan las peticiones de datos, las optimizaciones aplicadas en esta sesión y las recomendaciones para futuras mejoras.

## 1. Vista general

- Rutas:
  - `app/dashboard/layout.tsx` (Server Component):
    - Valida sesión y perfil en Supabase (redirecciones a `/signin` o `/complete-profile`).
    - Renderiza `SidebarProvider`, `AppSidebar` y cabecera.
  - `app/dashboard/page.tsx` (Client Component):
    - Página principal del dashboard con tarjetas de perfil, stats y cualidades.
  - Otras secciones:
    - `app/dashboard/rankings/page.tsx` reutiliza `components/sections/rankings/RankingsSection`.

- Componentes clave:
  - `components/app-sidebar.tsx`: Navegación del dashboard.
  - `components/dashboard/RankingsDashboard.tsx`: Ranking resumido con paginación.
  - `components/sections/rankings/RankingsSection.tsx`: Ranking público con tabla.
  - `components/dashboard/RankingsComponent.tsx`: Variación con tabs (shadcn).
  - `components/dashboard/QualityManager.tsx`: Gestión de cualidades para admins.

- Hooks/Utilidades:
  - `hooks/use-user.ts`: Estado de usuario y perfil.
  - `hooks/use-user-stats.ts`: Estadísticas del usuario (refactor a React Query).
  - `hooks/use-rankings.ts`: Hook nuevo para rankings con React Query.
  - `libs/supabase/client.ts`: Cliente navegador de Supabase.

- Layout global:
  - `app/layout.tsx` (Server) + `components/LayoutClient.tsx` (Client).
  - `LayoutClient` ahora envuelve con `QueryClientProvider` (React Query) y contiene: NextTopLoader, Toaster, Tooltip y Crisp.

## 2. Flujo de datos y peticiones

### 2.1 Autenticación y perfil
- Validación SSR en `app/dashboard/layout.tsx`:
  1) `supabase.auth.getUser()` (server) → redirección a login si no hay usuario.
  2) Consulta tabla `users` (server) → si faltan `name/surname`, redirección a `/complete-profile`.
- Capa cliente:
  - `hooks/use-user.ts` obtiene `/api/auth/profile` en el montaje inicial del cliente y escucha cambios de auth en Supabase para mantener el `profile` en memoria.

### 2.2 Página principal del Dashboard
- `app/dashboard/page.tsx` (cliente):
  - `supabase.auth.getUser()` → si no hay usuario: `router.push('/signin')`.
  - Perfil y cualidades: ahora se cargan en paralelo con `Promise.all`, seleccionando columnas específicas:
    - Perfil: `id,name,surname,skill_level,trend,email,phone,observations,created_at,is_admin`.
    - Cualidades: `user_qualities` + relación `qualities (id,name)`.
  - Estadísticas: `hooks/use-user-stats.ts` con React Query (`/api/user/stats`).

### 2.3 Rankings
- `hooks/use-rankings.ts` (nuevo):
  - `useQuery` con `queryKey: ['rankings', page, limit]`.
  - `placeholderData: (prev) => prev` para paginación fluida.
  - `staleTime: 60s`, `gcTime: 5m`, `refetchOnWindowFocus: false`.
- Consumidores:
  - `components/sections/rankings/RankingsSection.tsx`.
  - `components/dashboard/RankingsDashboard.tsx`.

## 3. Optimizaciones aplicadas

1) React Query en capa cliente
- `components/LayoutClient.tsx`:
  - Añadido `QueryClientProvider` con `QueryClient` memoizado.
- `hooks/use-user-stats.ts`:
  - Refactor a `useQuery` con `queryKey: ['user','stats']` y `staleTime`.
- `hooks/use-rankings.ts` (nuevo):
  - Centraliza fetch y caching de rankings.

2) Paginación y cambio de pestañas más suaves
- `RankingsSection` y `RankingsDashboard` ahora usan React Query, evitando re-fetch al volver de una pestaña.
- `components/dashboard/RankingsComponent.tsx` establece `forceMount` en `TabsContent` para no desmontar contenido al alternar tabs.

3) Paralelización de fetches
- `app/dashboard/page.tsx`: perfil y cualidades se solicitan en paralelo con `Promise.all` (menos latencia total).

4) Reducción de coste visual
- `app/dashboard/layout.tsx`: eliminado `backdrop-filter: blur(10px)` constante en el header y reemplazado por clases Tailwind opacas (`bg-white/5` + `border-white/10`).
- `app/dashboard/page.tsx`: se sustituyen estilos inline repetidos por clases utilitarias (`rounded-2xl`, `ring-white/20`, etc.).

## 4. Almacenamiento local (localStorage)
- La app no escribe claves propias. Lo único en el código es la limpieza `localStorage.removeItem('supabase.auth.token')` en `hooks/use-user.ts` al cerrar sesión.
- Supabase persiste por defecto la sesión en localStorage con claves `sb-<PROJECT_REF>-*` (auth token, code verifier). Crisp puede usar sus propias claves.
- React Query no persiste en localStorage (sólo memoria) — no hay persister configurado.

## 5. Recomendaciones siguientes

- User Provider / React Query para `profile`
  - Centralizar `profile` para evitar fetch duplicado en distintos componentes.

- Server-first del Dashboard Page + Suspense
  - Convertir `app/dashboard/page.tsx` a Server Component, hidratar islas interactivas y usar `Suspense` para skeletons con streaming.

- Caché en SSR / rutas API
  - Añadir `revalidate` o `unstable_cache` donde aplique (perfil estable, rankings levemente dinámicos) + cabeceras `Cache-Control` en `/api`.

- Prefetch de rutas
  - Asegurar prefetch en los `<Link>` del sidebar en producción para navegación instantánea.

- Virtualización para tablas grandes
  - Si rankings crece (>100 filas), usar `react-virtual` o `react-virtuoso` para mantener la UI fluida.

## 6. Índice de archivos modificados en esta sesión

- `components/LayoutClient.tsx` → Añadido `QueryClientProvider`.
- `hooks/use-user-stats.ts` → Migrado a React Query.
- `hooks/use-rankings.ts` → NUEVO hook para rankings.
- `components/sections/rankings/RankingsSection.tsx` → Refactor a `useRankings` (React Query) y paginación local.
- `components/dashboard/RankingsDashboard.tsx` → Refactor a `useRankings`.
- `components/dashboard/RankingsComponent.tsx` → `forceMount` en `TabsContent`.
- `app/dashboard/page.tsx` → Paralelización de fetches y clases utilitarias para estilos.
- `app/dashboard/layout.tsx` → Header con menos blur (mejor rendimiento).

## 7. Convenciones actuales

- Capa cliente: React Query v5 para fetch/caché (sin persister).
- Estilo: Tailwind; minimizar estilos inline para favorecer memoización.
- Supabase: cliente navegador en `libs/supabase/client.ts`; SSR en layout de dashboard para guardas.
- UI: shadcn/ui, Tabs con `forceMount` cuando sea importante evitar remounts.

---

Si aplicas nuevas optimizaciones (User Provider, Server Components con Suspense, headers de caché), actualiza este documento para mantener el contexto al día.
