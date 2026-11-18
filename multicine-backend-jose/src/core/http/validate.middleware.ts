import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { ValidationError } from './http.errors.js'

/**
 * Valida `request.body` con Zod antes de llegar al handler. El body se
 * reemplaza por el resultado ya parseado, así el handler nunca trabaja con
 * datos sin normalizar ni con campos extra.
 */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (request, _response, next) => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      next(
        new ValidationError(
          'Datos invalidos',
          result.error.issues.map((issue) => ({
            field: issue.path.join('.') || 'body',
            message: issue.message,
          })),
        ),
      )
      return
    }
    request.body = result.data
    next()
  }
