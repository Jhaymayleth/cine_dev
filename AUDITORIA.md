# Auditoría técnica — cine_dev (MineRoyal)

**Fecha:** 2026-11-18 · **Rama auditada:** `main` · **HEAD:** `ff991cf` · **Estado git al inicio:** limpio; el único cambio posterior es este `AUDITORIA.md` (untracked)  
**Alcance:** `multicine-backend-jose`, `multicine-frontend-jose`, documentación, Docker, pruebas y `.github`.  
**Método:** revisión estática de código y configuración; no se instalaron dependencias, no se ejecutaron builds ni contenedores.

## 1. Resumen ejecutivo

El repositorio **no es un monorepo terminado, sino una copia parcial/incompleta** de un proyecto en desarrollo. El README lo declara “en desarrollo” (`README.md:18`) y reconoce que el frontend consume un Mock Server de Postman mientras el backend “se encuentra estructurado y preparado” (`README.md:37-38`, `217`). Esa descripción coincide con el código: hay una interfaz de descubrimiento funcional y un esqueleto backend con algunos endpoints reales, pero los módulos de negocio son plantillas vacías y los flujos de compra, pago, tickets, membresía y administración no existen de punta a punta.

El frontend cubre landing, cartelera, filtros, detalle y selección estática de ubicación. La selección de funciones usa **datos aleatorios y hardcodeados**, no la API de funciones (`Details.tsx:86-92`, `181-194`). El backend implementa auth, catálogo y parte de booking directamente en `src/routes/*`, mientras `src/modules/*` contiene clases y routers vacíos (por ejemplo `modules/auth/auth.controller.ts:2-6`, `modules/admin/admin.routes.ts:1`). La arquitectura documentada `routes → controllers → services → repositories` (`docs/ARCHITECTURE.md:3`) no se cumple.

Los riesgos más graves son de **seguridad e integridad financiera**: el login del frontend autentica con un token falso ante cualquier fallo de red (`services/auth.service.ts:30-50`), y el backend acepta totales, precios, órdenes y pagos aprobados enviados por el cliente sin recalcularlos (`routes/booking.routes.ts:35,39,42`). Además hay IDOR en bloqueos, carritos y tickets. El Dockerfile del frontend no puede construir una app Next.js (`Dockerfile:9`) y la base de datos que está corriendo no coincide con `.env.example`.

**Veredicto:** apto únicamente como demo local de descubrimiento; **no apto para producción ni para un flujo real de compra**.

## 2. Documentación, alcance y señales de copia incompleta

- El README raíz describe fases y marca como pendientes funciones reales, mapa de asientos, checkout, pagos, QR, membresía, notificaciones, admin, pruebas y CI (`README.md:318-351`).
- El backend promete capas y 13 dominios (`docs/ARCHITECTURE.md:3-9`), pero los 13 módulos son stubs y la lógica está en tres archivos de rutas (`src/routes/index.ts:8-10`).
- El frontend se documenta como SPA con Vite y variables `VITE_*` (`multicine-frontend-jose/README.md:17`, `58-62`), pero el código es Next.js con `NEXT_PUBLIC_*`. También se documenta `npm run preview` (`README.md:72`), script que no existe en `package.json:6-12`.
- El plan de diseño referencia una ruta absoluta de otra máquina: `/home/cohorte5/Escritorio/Cine/...` (`PROJECT_PLAN.md:44`).
- Se referencian `docs/` raíz y `.husky/` (`multicine-frontend-jose/README.md:126-127`, `README.md:177`), pero no existen en el árbol.
- `src/docs/README.md:5-9` promete `errors.md` y `flows.md`; solo existe `openapi.ts`, que además no se monta como Swagger UI.
- Solo hay 3 commits (`ff991cf`, `69b6d11`, `d0182bd`), tests vacíos y una imagen Docker `riwi--cine-backend-app` construida por otro proyecto Compose (`riwi--cine-backend`), con `CMD ["npm","run","dev"]`.

## 3. Arquitectura e implementación real

```text
Next.js App Router (isla cliente, ssr:false)
  └─ React Router DOM → features/landing|details|auth → Axios → Mock Postman (/api)
Backend Express 4
  └─ /api → routes/{auth,catalog,booking}.routes.ts → Sequelize → PostgreSQL
```

- El frontend no usa el backend por defecto: `apiConfig` cae al mock de Postman (`src/config/api.ts:4`), y el detalle usa `featuredMovies` como fallback (`Details.tsx:142-149`).
- `app/page.tsx:5` y `app/[...slug]/page.tsx:5` renderizan la misma isla `legacy-app` con `ssr:false`; no hay SSR ni rutas Next reales. La migración está reconocida como transitoria (`README-NEXT.md:15`).
- Hay dos capas de UI duplicadas: `src/components/*` y `src/components/ui/*`; también dos `App.tsx` (`src/App.tsx:1-13` y `src/app/App.tsx:1-13`). Los servicios de booking, movie, promotion, user y admin son objetos vacíos (`src/services/booking.service.ts:1`, `admin.service.ts:1`, etc.).
- El backend define modelos y asociaciones (`src/models/index.ts:4-156`), pero usa `sequelize.sync()` y seed en cada arranque (`src/database/index.ts:7-9`), sin migraciones versionadas (`src/database/migrations/.gitkeep`).
- El error handler y el 404 existen (`core/http/error-handler.middleware.ts`, `not-found.middleware.ts`) pero **no se registran** en `app.ts:14-19`.

## 4. Estado por módulo

| Módulo | Estado | Evidencia |
|---|---|---|
| Auth backend | Parcial, funcional | Registro/login/perfil/refresh/logout en `routes/auth.routes.ts:12-54`; sin validación de esquema ni roles |
| Auth frontend | Parcial y engañoso | Formularios Zod OK, pero fallback que autentica sin API (`services/auth.service.ts:30-50`); perfil es placeholder (`routes/AppRoutes.tsx:11-23`) |
| Catálogo/cartelera | Parcial | `/movies`, `/movies/today|weekly|filter` existen (`catalog.routes.ts:15-18`), pero no filtran por estado y `today/weekly/filter` son alias |
| Detalle de película | Parcial | UI completa, pero funciones, salas y horarios son aleatorios (`Details.tsx:86-92`, `181-194`); `getFunctionsByMovie` no se consume |
| Ubicación/sedes | Simulado | Datos estáticos en `landing/data/locations.ts:1-14`; selección en `localStorage` (`SelectLocationPage.tsx:16-20`) |
| Funciones reales | No implementado en UI | Endpoint backend existe (`catalog.routes.ts:19-27`), pero la UI no lo llama |
| Asientos/bloqueo | Backend parcial, sin UI | `POST/DELETE /seatLocks` (`booking.routes.ts:10-20`); no hay mapa ni componentes en `features/reservations` |
| Carrito/confitería | Backend parcial, sin UI | `booking.routes.ts:22-32`; sin control de propiedad ni UI |
| Checkout/órdenes | Backend inseguro, sin UI | Total enviado por cliente (`booking.routes.ts:34-37`) |
| Pagos | Simulado | Pago creado como `APPROVED` sin proveedor (`booking.routes.ts:39`) |
| Tickets/QR | Parcial, sin UI | UUID como `qrCode`, precio del cliente (`booking.routes.ts:40-45`) |
| Promociones | Parcial, contrato desalineado | Backend devuelve modelo distinto al que pinta la UI (`models/index.ts:130-139` vs `PromotionsSection.tsx:54,65,77`) |
| Membresías/notificaciones/admin | Stubs | Routers vacíos (`modules/memberships/*.routes.ts:1`, `admin.routes.ts:1`); features con `.gitkeep` |
| Infra/Docker | Roto o desalineado | Frontend copia `/app/dist` (`Dockerfile:9`); backend Compose solo levanta DB (`docker-compose.yml:1-17`) |

## 5. Requisitos faltantes o incompletos

| ID | Requisito | Estado | Evidencia | Prioridad |
|---|---|---|---|---|
| RF-01 | Registro/login reales sin bypass | Incompleto | `auth.service.ts:30-50` devuelve token falso ante error; `store/useAuthStore.ts:34` confía en `localStorage` | P0 |
| RF-02 | Autorización por propietario y rol | Ausente | `booking.routes.ts:20,28-31,45`; no hay middleware de roles | P0 |
| RF-03 | Precios/totales calculados en servidor | Ausente | `booking.routes.ts:35,42`; contradice `README.md:231` | P0 |
| RF-04 | Pago real o estado pendiente verificable | Ausente | `booking.routes.ts:39` crea `APPROVED`; no hay proveedor | P0/P1 |
| RF-05 | Funciones reales por cine/fecha/formato | Ausente en UI | `Details.tsx:86-92,181-194`; endpoint sin usar (`movies.api.ts:32-37`) | P1 |
| RF-06 | Mapa de asientos y disponibilidad real | Ausente | `/seats` devuelve asientos sin estado (`catalog.routes.ts:50`); `functionView` fuerza `availableSeats=capacity` (`:8`) | P1 |
| RF-07 | Bloqueo temporal atómico y liberación segura | Incompleto | Check-then-create sin transacción (`booking.routes.ts:15-17`); borrado sin dueño (`:20`) | P1 |
| RF-08 | Carrito/confitería con ownership | Incompleto | `booking.routes.ts:28-31` | P1 |
| RF-09 | Promociones aplicadas al total | Ausente | Solo listado (`catalog.routes.ts:46-48`); no hay cálculo ni canje | P1 |
| RF-10 | Checkout e historial de compras | Ausente | `/orders` sin UI; total cliente (`booking.routes.ts:34-38`) | P1 |
| RF-11 | Tickets QR y consulta segura | Incompleto | UUID, no QR (`booking.routes.ts:42`); lectura por `orderId` sin dueño (`:45`) | P1 |
| RF-12 | Membresía, puntos, notificaciones | Ausente | Routers vacíos; features `.gitkeep` | P2 |
| RF-13 | Panel administrativo y roles | Ausente | `modules/admin/admin.routes.ts:1`; `features/admin/.gitkeep` | P2 |
| RF-14 | Contrato API estable y único | Incompleto | Frontend llama `/departments`, `/cinemas`, `/rooms`, `/users`, `/memberships`, `/giftCards` sin backend (`location.api.ts:10-40`, `user.api.ts:5-37`, `booking.api.ts:93-100`) | P1 |
| RF-15 | Tests, CI y despliegue | Ausente | Tests vacíos y sin runner; no hay workflows (ver §7) | P1/P2 |

## 6. Bugs y riesgos técnicos

- **B-01 (P0) — Bypass de autenticación en frontend.** Cualquier error de red o HTTP en login cae al `catch` y devuelve `mock-jwt-token-...` con usuario ficticio (`auth.service.ts:30-50`); el registro hace lo mismo (`:6-23`). Un backend caído se percibe como login exitoso.
- **B-02 (P0) — Integridad financiera.** El cliente decide `total`, `amount`, `price`, `orderId` y el pago nace aprobado (`booking.routes.ts:35,39,42`). No hay transacción que ligue orden, pago y tickets.
- **B-03 (P0) — IDOR / mass assignment.** Cualquier usuario autenticado puede borrar bloqueos ajenos, modificar cualquier carrito (`Cart.update(request.body)`), operar sobre `cartId` ajenos y leer tickets de cualquier orden (`booking.routes.ts:20,28-31,45`).
- **B-04 (P0) — Errores async no capturados.** Las rutas de booking no tienen `try/catch` ni wrapper; Express 4 no captura promesas rechazadas y no se registra `errorHandler` (`app.ts:14-19`). Un `NaN` o fallo de Sequelize puede colgar la petición o tumbar el proceso.
- **B-05 (P1) — Condición de carrera en asientos.** Dos requests concurrentes pueden pasar el `findOne` y crear dos bloqueos; no hay índice único (`models/index.ts:66-72`) ni transacción (`booking.routes.ts:15-17`). Tampoco se comprueba si el asiento ya tiene ticket.
- **B-06 (P1) — Docker frontend inválido.** `next build` genera `.next`, pero el stage final copia `/app/dist` (`Dockerfile:9`); además Nginx hace fallback SPA a `index.html` (`nginx.conf:8-10`), inexistente en Next. El build/despliegue documentado (`multicine-frontend-jose/README.md:78-83`) no funciona.
- **B-07 (P1) — Entorno de BD desalineado.** `.env.example` espera usuario/base `multicine`, contraseña `change-me` y puerto 5433 (`backend/.env.example:4-8`); el contenedor `riwi-cine-db` corre con otras credenciales, base `postgres` y sin puerto publicado. El backend no puede conectarse tal cual.
- **B-08 (P1) — Crash de UI al integrar backend.** `MovieArtwork` desestructura `palette` sin valor por defecto (`MovieArtwork.tsx:28`), pero `movieView` del backend no envía `palette` (`catalog.routes.ts:7`). `MovieCard` y `Details` pasan ese campo (`MovieCard.tsx:70`, `Details.tsx:265`).
- **B-09 (P1) — “Próximamente” y filtros inconsistentes.** La UI filtra `status === 'Coming Soon'` (`LandingPage.tsx:49-52`), pero el backend transforma `ACTIVE` en `Today` y deja el resto crudo (`catalog.routes.ts:7`); sus seeds son `ACTIVE`. Además `/movies` devuelve todos los estados (`catalog.routes.ts:15`).
- **B-10 (P2) — Redirección post-login rota.** `RequireLocation` guarda `from` como string (`RequireLocation.tsx:28`), mientras `LoginForm` espera `{ pathname }` (`LoginForm.tsx:28`); el usuario vuelve a `/` en vez de a la ruta original.
- **B-11 (P2) — Sesión no restaurada.** `restoreSession` se define (`useAuthStore.ts:80`) pero nunca se invoca; el estado inicial se basa en `localStorage` (`:20-34`) y el JWT dura 15 min sin refresh automático. `ProtectedRoute` es solo cliente (`ProtectedRoute.tsx:14-20`).
- **B-12 (P2) — Endpoints duplicados/muertos.** `/seats` y `/functions/:id/seats` repiten funcionalidad (`catalog.routes.ts:50`, `booking.routes.ts:46`); `/countries/all_countries` duplica `/countries` (`catalog.routes.ts:10-11`); `/recommendations` siempre devuelve `[]` (`:33`).
- **B-13 (P2) — Promociones desalineadas.** La UI exige `icon`, `accent`, `text`, `tag` (`PromotionsSection.tsx:54,65,77`), que el modelo backend no tiene (`models/index.ts:130-139`); además “Ver promoción” apunta a `#` (`PromotionsSection.tsx:85-90`).
- **B-14 (P2) — Recuperación de contraseña falsa.** El botón solo muestra un toast (`LoginForm.tsx:92`); no hay endpoint ni flujo.

## 7. Seguridad

- **Secretos:** no hay `.env` versionados; solo `.env.example` (`git ls-files`). Correcto. Pero los ejemplos usan `JWT_SECRET=change-me...` y credenciales de BD triviales (`backend/.env.example:7-8`), y el contenedor de desarrollo usa credenciales débiles distintas. `JWT_SECRET` es obligatorio (`config/env.ts:17`), lo cual está bien.
- **AuthN:** bcrypt con coste 12 (`auth.routes.ts:18`) y JWT de 15 min (`env.ts:18`, `utils/jwt.ts:4-5`). Sin rate limiting, bloqueo por intentos, verificación de email ni revocación. `refresh` reemite desde el payload sin consultar al usuario (`auth.routes.ts:46-49`).
- **Cookie vs localStorage:** se emite cookie `httpOnly` pero con `secure:false` (`auth.routes.ts:10`) y además se devuelve el token en el cuerpo (`:33`); el frontend lo guarda en `localStorage` (`api/client.ts:14`, `useAuthStore.ts:44-45`) y no activa `withCredentials` (`client.ts:5-11`). El beneficio de la cookie se pierde y el token queda expuesto a XSS.
- **AuthZ:** no hay comprobación de rol; `middlewares/auth.middleware.ts:6-21` solo valida firma. IDOR descritos en B-03.
- **Validación:** el backend no valida bodies con Zod ni con `auth.schemas.ts` (que solo contiene tipos, `modules/auth/auth.schemas.ts:1-13`); registro solo comprueba presencia (`auth.routes.ts:15`). `Cart.update(request.body)` permite mass assignment (`booking.routes.ts:28`).
- **CORS/cookies:** origen único por env con `credentials:true` (`app.ts:12`), pero el valor por defecto es `http://localhost:5173` (`env.ts:19`), puerto legacy de Vite; Next usa 3000 y el contenedor 8080. Sin CSRF token para auth por cookie.
- **Exposición:** los errores de auth devuelven `error.message` interno (`auth.routes.ts:21,35`); no hay Helmet, límite de payload explícito, logging de requests ni rate limit. `/api/docs.json` es público (`app.ts:15`) y `swagger-ui-express` está instalado pero sin montar (`package.json:20-21`).
- **Integridad:** “Precios y disponibilidad validados en el servidor” (`README.md:231`) es falso con el código actual; igual que “pagos reales delegados” (`README.md:233`).

## 8. Calidad, pruebas y CI

- **Backend:** `tests/{unit,integration,fixtures}` solo contienen `.gitkeep`; `npm test` es `jest --passWithNoTests` (`package.json:10`), sin Jest config, sin `ts-jest`/transform y con proyecto ESM (`"type":"module"`). Es un pase vacío, no una suite.
- **Frontend:** existen dos tests (`src/tests/store/useAuthStore.test.ts`, `src/tests/validations/auth.validation.test.ts`) pero **no hay script `test`** (`package.json:6-12`), no hay `vitest.config.*`, no hay setup de `jsdom` y `tsconfig.json:43` excluye un `vitest.config.ts` inexistente. En el entorno por defecto de Vitest (node) `localStorage` no existe y el test de store fallaría.
- **CI:** no hay `.github/workflows`; solo `multicine-frontend-jose/.github/pull_request_template.md`. El README marca CI/CD como pendiente (`README.md:350`).
- **Lint/typecheck:** frontend tiene `lint` y `typecheck`; backend solo `build`/`test` y no tiene linter. ESLint ignora solo `dist` y no incluye el plugin de Next (`eslint.config.js:8`), por lo que puede analizar artefactos `.next`.
- **Código muerto/deuda:** 13 módulos backend con métodos `void` (`modules/*/**.service.ts:1`), servicios frontend vacíos (`src/services/*.service.ts:1`), `config/cors.ts` sin uso (`app.ts:12` usa `cors` directo), dos sistemas de botones (`components/button.tsx` y `components/ui/button.tsx`) y dos `App.tsx`.
- **Documentación:** contradicciones Vite/Next, `VITE_*`/`NEXT_PUBLIC_*`, `preview` inexistente, `docs/` y `.husky/` ausentes, `PROJECT_PLAN.md:44` con ruta de otra máquina. `README.md:38` y `217` confirman que el mock sigue siendo la fuente real.
- **Observabilidad:** `core/observability/logger.ts` existe pero no se usa; solo `console.log` en `src/index.ts:9-12`.

## 9. Git

- Rama actual: `main`. `git status --short` al inicio: sin cambios; tras el entregable solo aparece `?? AUDITORIA.md`.
- Últimos commits: `ff991cf fix: update logo assets and clean placeholders`, `69b6d11 docs: update readme branding to mineroyal`, `d0182bd chore: publish multicine frontend and backend`.
- Volumen: 307 archivos versionados; backend `src` ≈ 777 líneas (incluidos modelos y stubs) y frontend `app`+`src` ≈ 9.200 líneas, mayormente UI y datos mock.

## 10. Plan priorizado

### P0 — Bloqueantes de seguridad y corrección (antes de cualquier demo con cuentas reales)

| Acción | Criterio de aceptación |
|---|---|
| Eliminar el fallback de login/registro simulado y el token falso | Con API caída o credenciales inválidas, el login falla con error; no se crea sesión ni token en `localStorage`; test que lo verifique |
| Recalcular precios/totales/estado de pago y tickets en servidor, dentro de una transacción | Alterar `total`, `amount` o `price` en la request no cambia la orden; pago nace `PENDING` y solo pasa a `APPROVED` con confirmación del proveedor |
| Corregir IDOR y mass assignment en seatLocks, carts, cartSnacks, orders, payments y tickets | Acceso cruzado entre usuarios devuelve 403/404; tests de autorización por recurso |
| Registrar `errorHandler`/`notFoundHandler` y envolver handlers async; validar bodies con Zod | IDs inválidos devuelven 400 JSON; ninguna petición queda colgada; test de error handler |

### P1 — Funcionalidad núcleo y despliegue

| Acción | Criterio de aceptación |
|---|---|
| Reemplazar horarios/salas aleatorios por `/movies/:id/functions`, `/functions/:id/prices` y disponibilidad real | La vista de detalle muestra funciones del backend, sin `Math.random`; fechas correctas |
| Bloqueo de asientos atómico: transacción, índice único, verificación de ticket y liberación por dueño | Prueba concurrente: un solo bloqueo exitoso, el segundo recibe 409; no se puede borrar un lock ajeno |
| Implementar UI de asientos, carrito, checkout e historial (o retirar los clientes API no usados) | Flujo completo contra backend, con estados de error/carga y sin endpoints huérfanos |
| Alinear contrato API: locations (`/departments`, `/cinemas`, `/rooms`), `/users`, `/memberships`, `/giftCards` | OpenAPI y frontend usan los mismos paths; test de contrato o tipos generados |
| Arreglar Docker frontend (salida Next standalone o export estático) y Compose backend (app + DB + migraciones) | `docker build` y `docker compose up` levantan frontend y backend; deep link y `/health` responden |
| Unificar entorno de BD con `.env.example`, agregar migraciones versionadas y quitar `sync()`/seed de arranque | Migración reproducible en BD vacía; arranque no altera esquema; seed explícito |
| Endurecer cookies/CORS (`secure` por entorno, origen correcto, `withCredentials` o estrategia Bearer) | Origen no permitido rechazado; cookie no viaja en HTTP; sesión sobrevive refresh sin token en localStorage |
| CI mínimo: lint, typecheck, build y tests en ambos proyectos | Pipeline verde en PR; falla si se rompe cualquiera de los cuatro |

### P2 — Producto y calidad

| Acción | Criterio de aceptación |
|---|---|
| Implementar membresías/puntos, notificaciones, admin y roles | Endpoints con autorización y UI mínima; tests por rol |
| Payment provider real, QR verificable e historial | Pago idempotente, webhook firmado, QR escaneable y ticket consultable solo por su dueño |
| Suite de pruebas: unitarias de servicios, integración de API, E2E del flujo de compra | Cobertura acordada y E2E estable en CI |
| Limpieza de código muerto, documentación y migración completa a App Router/SSR | Sin módulos vacíos, README único y coherente, metadatos/SEO renderizados en servidor |
| Observabilidad, rate limiting, Helmet y auditoría de dependencias | Logs estructurados, límites activos y escaneo sin vulnerabilidades críticas |

## 11. Estado posterior (2026-11-18, misma fecha)

Esta sección registra lo corregido después de la revisión inicial; los números de arriba describen el estado en `ff991cf`.

| Área | Cambio | Verificación |
|---|---|---|
| B-01 login simulado | Eliminado el token falso; un fallo de API deja el login en error | `src/tests/store/useAuthStore.test.ts` (caso de credenciales rechazadas) |
| B-02 integridad financiera | `POST /checkout` calcula la orden y sus precios desde `CinemaFunction.basePrice`; `POST /orders/:orderId/tickets` toma asientos de `OrderSeat`; el pago nace `PENDING` | E2E `tests/e2e/checkout.e2e.mjs` |
| B-03 IDOR | `userId` sale solo del token en seatLocks, carts, cartSnacks, tickets, orders y payments; `Cart.update(request.body)` sustituido por 400 | E2E (otro usuario recibe 404 en `/tickets`) |
| B-04 errores async | `errorHandler`/`notFoundHandler` registrados y handlers envueltos en `asyncHandler` | `tsc --noEmit` y respuestas 400/404 JSON del E2E |
| B-05 carrera de asientos | Bloqueo en transacción con `LOCK.UPDATE`, índice único en `OrderSeat` y verificación de ticket vendido | E2E (checkout sin bloqueo responde 409) |
| B-06 Docker frontend | Dockerfile usa la salida `standalone` de Next; `nginx.conf` inválido eliminado | `docker compose up --build` levanta frontend en 8080 (HTTP 200) |
| B-12 endpoints muertos | Retirados los clientes sin backend (`/departments`, `/rooms`, `/users`, `/memberships`, `/giftCards`); OpenAPI lista solo rutas reales y se sirve Swagger UI en `/api/docs` | `src/docs/openapi.ts`, `src/app.ts` |
| RF-05/RF-06 | El detalle usa funciones reales del backend y mapa de asientos con estado real | `Details.tsx`, `SeatMap.tsx` |
| RF-10/RF-11 | Checkout, historial y tickets con QR desde el detalle | E2E (18 aserciones) |
| CI y tests | Vitest en ambos proyectos (`npm test`) y workflow `.github/workflows/ci.yml` (typecheck, tests, build), aún **sin versionar**: el token de push no tiene el scope `workflow` | `npm test` local: 8 + 11 pruebas verdes |
| Compose | `docker-compose.yml` raíz con Postgres, API y frontend | `docker compose up -d --build` y `curl /health` → 200 |

**Sigue pendiente:**

- Migraciones versionadas y retiro de `sequelize.sync()`/seed de arranque (requiere decidir el flujo de BD).
- Webhook firmado del proveedor de pagos y QR escaneable (no hay credenciales de proveedor).
- Endurecer cookies/CORS por entorno y rate limiting/Helmet.
- `npm run lint` en el frontend falla con 51 errores previos (reglas `react-hooks/set-state-in-effect` y variables sin uso); por eso el CI no incluye lint todavía.
- Membresías, notificaciones y panel admin (stubs, P2).

## 12. Conclusión

`cine_dev` es una **copia de portafolio parcial**, no un sistema full stack terminado: la parte visual de descubrimiento está avanzada y el backend tiene una base razonable de Express/Sequelize, pero la compra de entradas existe solo como maqueta y los endpoints sensibles no son seguros. Antes de presentarlo como “plataforma de reservas” deben cerrarse los P0 y, como mínimo, los P1 de Docker, entorno y contrato API. La evidencia de esta auditoría es estática y verificable en las rutas y líneas citadas; no se ejecutaron instalaciones ni builds por restricción del encargo.
