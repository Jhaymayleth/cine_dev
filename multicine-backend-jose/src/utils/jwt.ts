import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'

export const generateToken = (payload: object): string =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] })

export const verifyToken = <T>(token: string): T => jwt.verify(token, env.jwtSecret) as T
