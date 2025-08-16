# Documentación del Proyecto – Padel Segrià

Este directorio recoge documentación viva para orientar futuras sesiones de desarrollo. Sirve como contexto sobre cómo está estructurado el dashboard, cómo se gestionan las peticiones de datos y qué decisiones de rendimiento se han tomado.

- Documento principal: [Arquitectura y flujo del Dashboard](./dashboard-architecture.md)
- Última actualización: 2025-08-16

## Resumen de cambios de esta sesión

En esta sesión hemos optimizado el dashboard para hacerlo más fluido al cambiar de pestaña:

- Añadido React Query en la capa cliente para cachear datos y evitar re-fetchs innecesarios.
- Refactor de hooks y secciones de rankings para usar caché con paginación suave.
- Paralelización de llamadas a perfil y cualidades del usuario en la página del dashboard.
- Reducción de efectos visuales costosos (blur de fondo) en el header del dashboard.
- Ajustes de estilos inline a clases para mejorar memoización y estabilidad de renders.

Consulta el documento de arquitectura para el detalle completo y rutas de archivo exactas.
