# Multicine Backend

Backend base para la plataforma de venta de entradas de cine y su frontend.

## Tecnologias

- Node.js y Express
- TypeScript
- PostgreSQL y Sequelize
- JWT en cookie HTTP-only
- bcrypt
- Swagger
- Jest
- Docker Compose

## Desarrollo

```bash
cp .env.example .env
npm install
npm run dev
```

La API queda disponible en `http://localhost:3000` y el health check en `/health`.

## Estructura

```text
multicine-backend/
├── src/
│   ├── app.ts                  Configuracion de Express
│   ├── index.ts                Punto de entrada
│   ├── config/                 Entorno, constantes, CORS y base de datos
│   ├── core/                   Infraestructura transversal y errores
│   ├── shared/                 Tipos y utilidades compartidas
│   ├── database/               Inicializacion, migraciones y seeders
│   ├── docs/                   Contratos OpenAPI
│   ├── middlewares/            Autenticacion y middleware HTTP
│   ├── models/                 Modelos Sequelize y asociaciones
│   ├── routes/                 Composicion de rutas publicas
│   └── modules/                Dominios aislados del negocio
│       ├── auth/
│       ├── users/
│       ├── locations/
│       ├── catalog/
│       ├── scheduling/
│       ├── booking/
│       ├── checkout/
│       ├── payments/
│       ├── tickets/
│       ├── promotions/
│       ├── memberships/
│       ├── notifications/
│       └── admin/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
├── Dockerfile
└── docker-compose.yml
```

Cada modulo contiene, como minimo, `routes`, `controller`, `service`, `repository`, `types` e `index`. La implementacion de cada caso de uso se agrega en su modulo sin mezclar reglas de negocio con Express o Sequelize.

## Flujo de compra previsto

`ubicacion -> cartelera -> funcion -> asientos -> bloqueo -> carrito -> checkout -> pago -> ticket`

El contrato inicial se encuentra en `docs/API-CONTRACT.md` y las decisiones de arquitectura en `docs/ARCHITECTURE.md`.
