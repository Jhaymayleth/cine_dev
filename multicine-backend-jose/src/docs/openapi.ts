export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Multicine API', version: '1.0.0', description: 'API para cartelera y venta de entradas de cine.' },
  servers: [{ url: 'http://localhost:3000' }],
  paths: {
    '/health': { get: { summary: 'Estado de la API' } },
    '/api/auth/register': { post: { summary: 'Registrar usuario' } },
    '/api/auth/login': { post: { summary: 'Iniciar sesion' } },
    '/api/auth/profile': { get: { summary: 'Obtener perfil autenticado' } },
    '/api/movies': { get: { summary: 'Listar peliculas' } },
    '/api/movies/{movieId}/functions': { get: { summary: 'Listar funciones futuras' } },
    '/api/functions/{functionId}/prices': { get: { summary: 'Consultar precio' } },
    '/api/seats': { get: { summary: 'Listar asientos de una funcion' } },
    '/api/seatLocks': { post: { summary: 'Bloquear asiento' } },
    '/api/orders': { post: { summary: 'Crear orden' }, get: { summary: 'Historial de ordenes' } },
    '/api/payments': { post: { summary: 'Registrar pago' } },
    '/api/tickets': { get: { summary: 'Consultar tickets' }, post: { summary: 'Emitir tickets' } },
  },
} as const
