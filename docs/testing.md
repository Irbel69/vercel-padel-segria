---
title: Testing Guide
---

# Testing Guide (Jest)

Este proyecto usa Jest para todos los tests. Evita mezclar frameworks: usa siempre Jest.

## Requisitos

- Node.js 18+
- Dependencias instaladas (incluye jest, ts-jest, @types/jest)

## Comandos básicos

1) Ejecutar toda la suite:

```
npm test
```

2) Ejecutar un único archivo:

```
npm test -- __tests__/rate-limiter.test.ts
```

3) Ver salida detallada / depurar handles abiertos:

```
npm test -- --detectOpenHandles --runInBand
```

## Notas

- Los tests están escritos en TypeScript y se transforman con ts-jest.
- Para evitar timers/intervalos colgando, puedes forzar `NODE_ENV=test` al lanzar Jest si lo necesitas.
- Añade nuevos tests en `__tests__/` con el sufijo `.test.ts`.

## Estructura relevante

- `__tests__/rate-limiter.test.ts`: pruebas de la lógica de rate limit e IP detection.
- `jest.config.js`: configuración de Jest/ts-jest.
