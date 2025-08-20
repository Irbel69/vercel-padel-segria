# Documentación del Proyecto – Padel Segrià

Este directorio recoge documentación viva para orientar futuras sesiones de desarrollo. Sirve como contexto sobre cómo está estructurado el dashboard, cómo se gestionan las peticiones de datos y qué decisiones de rendimiento se han tomado.

- Documento principal: [Arquitectura y flujo del Dashboard](./dashboard-architecture.md)
- Última actualización: 2025-08-20
- Cambios recientes: consulta el [CHANGELOG](./CHANGELOG.md)

## Resumen de cambios recientes

### React Query para Eventos del Dashboard (2025-08-20)

Implementación de React Query para la gestión de eventos en el dashboard:

- **Nuevo hook**: `hooks/use-events.ts` con funciones para listado paginado, inscripciones y invitaciones.
- **Dashboard refactorizado**: `app/dashboard/tournaments/page.tsx` usa React Query con invalidación automática de caché.
- **Landing page sin cambios**: `components/sections/events/EventsSection.tsx` mantiene fetch manual.
- **Sin localStorage**: solo caché en memoria con `staleTime` y `gcTime` optimizados.

### Arreglos en Invitaciones por Pareja (2025-08-20)

Mejoras y arreglos en el flujo de invitaciones por pareja (pair invites):

- Alineación del esquema de base de datos con la implementación (campos `invitee_*`, `token`, `short_code`, enum de estado, timestamps).
- Solucionado error de caché de PostgREST (PGRST204) recargando el esquema después de las migraciones.
- End-point de aceptación (`POST /api/invites/[token]/accept`) ahora es idempotente: solo hace upsert de la inscripción del invitado (invitee) con `pair_id` y ajusta el control de aforo a +1.
- Documentación actualizada en `docs/pair-invites-implementation.md` y `docs/pair-invites-next-steps.md`.

Consulta el documento de arquitectura para el detalle completo y rutas de archivo exactas.
