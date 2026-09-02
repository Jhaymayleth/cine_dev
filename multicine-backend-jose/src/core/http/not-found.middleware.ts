import type { RequestHandler } from 'express'

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({ message: `Ruta no encontrada: ${request.method} ${request.path}`, code: 'ROUTE_NOT_FOUND' })
}
