# Arquitectura

## Capas

`routes -> controllers -> services -> repositories -> models -> PostgreSQL`

- `routes`: registra endpoints y middleware.
- `controllers`: traduce HTTP a casos de uso.
- `services`: contiene reglas de negocio y transacciones.
- `repositories`: concentra consultas Sequelize.
- `models`: representa persistencia y asociaciones.
- `schemas` y `dtos`: validan y tipan contratos.
- `core`: infraestructura transversal.
- `modules`: dominios aislados del negocio.

## Dominios

`auth`, `users`, `locations`, `catalog`, `scheduling`, `booking`, `checkout`, `payments`, `tickets`, `promotions`, `memberships`, `notifications` y `admin`.

Cada dominio puede evolucionar de forma independiente y publicar solo sus contratos desde `index.ts`.
