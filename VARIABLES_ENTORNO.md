# Variables de entorno — cine_dev (Multicine)

**Fecha:** 2026-11-18
**Arquitectura:** backend Express + Sequelize/PostgreSQL (`multicine-backend-jose`) y frontend Next.js (`multicine-frontend-jose`).

## Cómo se cargan

- **Backend:** `dotenv/config` + `multicine-backend-jose/src/config/env.ts`. `JWT_SECRET` es **obligatorio siempre** (`required()` lanza si falta).
- **Frontend:** Next.js carga `.env.local` / `.env`; solo `NEXT_PUBLIC_*` llega al navegador y se inlinea en build.
- Cada subproyecto versiona su `.env.example`; no hay `.env` en el repo.

## Backend

| Variable | ¿Obligatoria? | Por defecto | Ejemplo | Uso / evidencia |
|---|---|---|---|---|
| `JWT_SECRET` | **Sí, siempre** | — (lanza error) | cadena larga aleatoria | Firma de JWT (`src/config/env.ts:17`). |
| `NODE_ENV` | No | `development` | `production` | Entorno (`env.ts:10`). |
| `APP_PORT` | No | `3000` | `3000` | Puerto del API (`env.ts:11`). |
| `POSTGRES_HOST` | No | `localhost` | `localhost` / `db` | Host de PostgreSQL. |
| `POSTGRES_PORT` | No | `5433` | `5433` | Puerto. |
| `POSTGRES_DB` | No | `multicine` | `multicine` | Base de datos. |
| `POSTGRES_USER` | No | `multicine` | `multicine` | Usuario. |
| `POSTGRES_PASSWORD` | No (Sí en producción) | `multicine-local-password` | secreto | Contraseña. |
| `JWT_EXPIRES_IN` | No | `15m` | `15m` / `7d` | Vida del token. |
| `CORS_ORIGIN` | No | `http://localhost:3001` | `http://localhost:3001` | Origen permitido. En desarrollo el backend usa `:3000` y Next `:3001` (`next dev -p 3001`); en Docker el origen es `:8080`. |

### Importante para `docker-compose.yml`

El Compose del backend usa `${POSTGRES_DB}`, `${POSTGRES_USER}` y `${POSTGRES_PASSWORD}` **sin valores por defecto**: debes crear un `.env` en `multicine-backend-jose/` o `docker compose` fallará/creará la BD vacía.

## Frontend

| Variable | ¿Obligatoria? | Por defecto | Ejemplo | Uso |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Sí** (build) | `http://localhost:3000` (antes mock de Postman) | `http://localhost:3000` | Base de la API (`src/config/api.ts:4`). |
| `NEXT_PUBLIC_API_TIMEOUT` | No | `10000` | `10000` | Timeout en ms (`api.ts:5`). |
| `NEXT_PUBLIC_APP_NAME` | No | — | `Multicine` | Declarada en `.env.example`; **no se usa en el código actual**. |
| `NEXT_PUBLIC_APP_ENV` | No | — | `development` | Declarada; **no se usa**. |
| `NEXT_PUBLIC_PUBLIC_KEY` | No | — | — | Declarada; **no se usa**. |

## `.env` mínimo para local

Backend (`multicine-backend-jose/.env`):

```bash
NODE_ENV=development
APP_PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=multicine
POSTGRES_USER=multicine
POSTGRES_PASSWORD=cambia-esta-clave
JWT_SECRET=cambia-esta-clave-por-una-larga-y-aleatoria
JWT_EXPIRES_IN=15m
CORS_ORIGIN=http://localhost:3001
```

Frontend (`multicine-frontend-jose/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_TIMEOUT=10000
```

## Notas y trampas conocidas

- El frontend apunta al backend local por defecto; define `NEXT_PUBLIC_API_URL` para usar el mock de Postman u otro entorno.
- El `Dockerfile` del frontend ya usa `output: standalone` y copia `.next/standalone` + `.next/static` (antes copiaba `/app/dist` y el contenedor no arrancaba). Las `NEXT_PUBLIC_*` se pasan como **build args** en `docker-compose.yml` porque se inlinean en build.
- El backend exige `JWT_SECRET` incluso en desarrollo; sin él no arranca.
- `CORS_ORIGIN` debe coincidir con el origen real del frontend: `:3001` con `npm run dev` y `:8080` con el Compose.
- No subas `.env` ni `.env.local`; rota `JWT_SECRET` y `POSTGRES_PASSWORD` si se expusieron.
