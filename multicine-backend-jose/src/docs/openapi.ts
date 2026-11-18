/**
 * Contrato vivo de la API. Solo lista rutas que existen en `src/routes/*`;
 * si se agrega o elimina un endpoint hay que actualizar este archivo.
 */
export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Multicine API',
    version: '1.0.0',
    description: 'API para cartelera y venta de entradas de cine.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/health': { get: { summary: 'Estado de la API' } },

    '/api/auth/register': { post: { summary: 'Registrar usuario' } },
    '/api/auth/login': { post: { summary: 'Iniciar sesion' } },
    '/api/auth/profile': { get: { summary: 'Obtener perfil autenticado' } },
    '/api/auth/refresh': { post: { summary: 'Renovar token' } },
    '/api/auth/logout': { post: { summary: 'Cerrar sesion' } },

    '/api/countries': { get: { summary: 'Listar paises' } },
    '/api/countries/{countryId}/cities': { get: { summary: 'Listar ciudades de un pais' } },
    '/api/cities/{cityId}/cinemas': { get: { summary: 'Listar cines de una ciudad' } },

    '/api/movies': { get: { summary: 'Listar peliculas' } },
    '/api/movies/today': { get: { summary: 'Cartelera del dia' } },
    '/api/movies/weekly': { get: { summary: 'Cartelera semanal' } },
    '/api/movies/filter': { get: { summary: 'Cartelera filtrada' } },
    '/api/movies/{movieId}': { get: { summary: 'Detalle de pelicula' } },
    '/api/movies/{movieId}/functions': { get: { summary: 'Listar funciones futuras' } },
    '/api/movies/{movieId}/recommendations': { get: { summary: 'Recomendaciones' } },
    '/api/functions/{functionId}': { get: { summary: 'Detalle de una funcion' } },
    '/api/functions/{functionId}/prices': { get: { summary: 'Consultar precio' } },
    '/api/functions/{functionId}/seats': { get: { summary: 'Asientos con estado de una funcion' } },
    '/api/seats': { get: { summary: 'Asientos de una funcion (query functionId)' } },

    '/api/promotions': { get: { summary: 'Promociones activas' } },
    '/api/promotions/active': { get: { summary: 'Promociones activas' } },
    '/api/promotions/{id}': { get: { summary: 'Detalle de promocion' } },

    '/api/seatLocks': { get: { summary: 'Bloqueos vigentes' }, post: { summary: 'Bloquear asiento' } },
    '/api/seatLocks/{id}': { delete: { summary: 'Liberar bloqueo propio' } },
    '/api/carts': { get: { summary: 'Carrito del usuario' }, post: { summary: 'Crear o recuperar carrito' } },
    '/api/carts/{id}': { patch: { summary: 'Sin campos editables: responde 400' } },
    '/api/cartSnacks': { get: { summary: 'Confiteria de un carrito' }, post: { summary: 'Agregar producto al carrito' } },
    '/api/cartSnacks/{id}': { delete: { summary: 'Quitar producto del carrito' } },
    '/api/snacks': { get: { summary: 'Catalogo de confiteria' } },

    '/api/orders': { post: { summary: 'Crear orden de confiteria' }, get: { summary: 'Historial de ordenes' } },
    '/api/checkout': { post: { summary: 'Crear orden desde asientos bloqueados' } },
    '/api/payments': { post: { summary: 'Registrar pago pendiente' } },
    '/api/orders/{orderId}/tickets': { post: { summary: 'Emitir tickets de una orden' } },
    '/api/tickets': { get: { summary: 'Tickets de una orden propia (query orderId)' } },
  },
} as const
