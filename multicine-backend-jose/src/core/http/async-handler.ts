import type { NextFunction, Request, RequestHandler, Response } from 'express'

type AsyncRoute = (request: Request, response: Response, next: NextFunction) => Promise<unknown>

/**
 * Express 4 no captura promesas rechazadas: sin este wrapper un fallo de
 * Sequelize deja la petición colgada o tumba el proceso.
 */
export const asyncHandler =
  (handler: AsyncRoute): RequestHandler =>
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
