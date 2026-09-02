import type { ErrorRequestHandler } from 'express'
import { AppError } from './http.errors.js'

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message, code: error.code, details: error.details })
    return
  }

  response.status(500).json({ message: 'Error interno del servidor', code: 'INTERNAL_ERROR' })
}
