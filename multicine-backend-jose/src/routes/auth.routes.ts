import { Router } from 'express'
import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { User } from '../models/index.js'
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware.js'
import { generateToken } from '../utils/jwt.js'
import { asyncHandler } from '../core/http/async-handler.js'
import { validateBody } from '../core/http/validate.middleware.js'
import { loginSchema, registerSchema } from './schemas.js'

export const authRouter = Router()

const BCRYPT_ROUNDS = 12

const publicUser = (user: any) => ({ id: String(user.id), fullName: user.fullName, email: user.email, phone: user.phone, role: user.role })
const setAccessCookie = (response: any, token: string) => response.cookie('accessToken', token, { httpOnly: true, sameSite: 'lax', secure: env.nodeEnv === 'production', maxAge: 15 * 60 * 1000 })

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (request, response) => {
    const { fullName, email, phone, password } = request.body
    const exists = await User.findOne({ where: { email } })
    if (exists) return response.status(409).json({ message: 'El correo ya esta registrado' })

    const user = await User.create({ fullName, email, phone, passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS), role: 'CLIENT' })
    return response.status(201).json({ message: 'Usuario registrado exitosamente', user: publicUser(user) })
  }),
)

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (request, response) => {
    const { email, password } = request.body
    const user: any = await User.findOne({ where: { email } })
    // Mismo mensaje para correo inexistente y contrasena incorrecta: no se
    // revela que cuentas existen.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return response.status(401).json({ message: 'Credenciales invalidas' })
    }

    const userData = publicUser(user)
    const token = generateToken({ userId: userData.id, email: userData.email, role: userData.role })
    setAccessCookie(response, token)
    return response.json({ message: 'Inicio de sesion exitoso', token, user: userData })
  }),
)

authRouter.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const user = await User.findByPk(Number(request.user?.userId))
    if (!user) return response.status(404).json({ message: 'Usuario no encontrado' })
    return response.json(publicUser(user))
  }),
)

authRouter.post(
  '/refresh',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    // Revalidar contra la BD: antes se reemitía el token desde el payload, así
    // que un usuario borrado o con el rol cambiado seguía renovando sesión.
    const user: any = await User.findByPk(Number(request.user?.userId))
    if (!user) {
      response.clearCookie('accessToken')
      return response.status(401).json({ message: 'Sesion no valida' })
    }
    const token = generateToken({ userId: String(user.id), email: user.email, role: user.role })
    setAccessCookie(response, token)
    return response.json({ token })
  }),
)

authRouter.post('/logout', (_request, response) => {
  response.clearCookie('accessToken')
  return response.status(204).send()
})
