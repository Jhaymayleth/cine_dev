import { Router } from 'express'
import bcrypt from 'bcrypt'
import { User } from '../models/index.js'
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware.js'
import { generateToken } from '../utils/jwt.js'

export const authRouter = Router()

const publicUser = (user: any) => ({ id: String(user.id), fullName: user.fullName, email: user.email, phone: user.phone, role: user.role })
const setAccessCookie = (response: any, token: string) => response.cookie('accessToken', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 15 * 60 * 1000 })

 authRouter.post('/register', async (request, response) => {
  try {
    const { fullName, email, phone, password } = request.body
    if (!fullName || !email || !phone || !password) return response.status(400).json({ message: 'Todos los campos son obligatorios' })
    const exists = await User.findOne({ where: { email } })
    if (exists) return response.status(409).json({ message: 'El correo ya esta registrado' })
    const user = await User.create({ fullName, email, phone, passwordHash: await bcrypt.hash(password, 12), role: 'CLIENT' })
    return response.status(201).json({ message: 'Usuario registrado exitosamente', user: publicUser(user) })
  } catch (error) {
    return response.status(500).json({ message: error instanceof Error ? error.message : 'No se pudo registrar el usuario' })
  }
})

authRouter.post('/login', async (request, response) => {
  try {
    const { email, password } = request.body
    const user: any = await User.findOne({ where: { email } })
    if (!user || !(await bcrypt.compare(password ?? '', user.passwordHash))) return response.status(401).json({ message: 'Credenciales invalidas' })
    const userData = publicUser(user)
    const token = generateToken({ userId: userData.id, email: userData.email, role: userData.role })
    setAccessCookie(response, token)
    return response.json({ message: 'Inicio de sesion exitoso', token, user: userData })
  } catch (error) {
    return response.status(500).json({ message: error instanceof Error ? error.message : 'No se pudo iniciar sesion' })
  }
})

authRouter.get('/profile', authMiddleware, async (request: AuthenticatedRequest, response) => {
  const userId = request.user?.userId
  const user = await User.findByPk(Number(userId))
  if (!user) return response.status(404).json({ message: 'Usuario no encontrado' })
  return response.json(publicUser(user))
})

authRouter.post('/refresh', authMiddleware, (request: AuthenticatedRequest, response) => {
  const token = generateToken(request.user ?? {})
  setAccessCookie(response, token)
  return response.json({ token })
})

authRouter.post('/logout', (_request, response) => {
  response.clearCookie('accessToken')
  return response.status(204).send()
})
