# Contrato inicial con el frontend

- Prefijo: `/api`.
- IDs: strings en respuestas publicas; persistencia numerica interna permitida.
- Auth: Bearer token o cookie HTTP-only `accessToken`.
- Fechas: ISO 8601.
- Errores: `{ message, code, details? }`.
- Compra: ubicacion -> pelicula -> funcion -> asientos -> bloqueo -> carrito -> orden -> pago -> tickets.
