import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../utils/jwt.js'

export type AuthenticatedRequest = Request & { user?: Record<string, unknown> }

export const authMiddleware = (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
  const authorization = request.header('authorization')
  const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined
  const token = bearerToken ?? request.cookies?.accessToken

  if (!token) {
    response.status(401).json({ message: 'No autenticado' })
    return
  }

  try {
    request.user = verifyToken<Record<string, unknown>>(token)
    next()
  } catch {
    response.clearCookie('accessToken')
    response.status(401).json({ message: 'Token invalido o expirado' })
  }
}
