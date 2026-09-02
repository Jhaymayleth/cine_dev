import crypto from 'node:crypto'
import { Op } from 'sequelize'
import { Router } from 'express'
import { Cart, CartSnack, CinemaFunction, Order, Payment, Seat, SeatLock, Snack, Ticket } from '../models/index.js'
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware.js'

export const bookingRouter = Router()
const userIdFrom = (request: AuthenticatedRequest) => Number(request.user?.userId ?? request.body?.userId ?? request.query?.userId)

bookingRouter.post('/seatLocks', authMiddleware, async (request: AuthenticatedRequest, response) => {
  const userId = userIdFrom(request)
  const { seatId, functionId } = request.body
  const seat = await Seat.findOne({ where: { id: Number(seatId), functionId: Number(functionId) } })
  if (!seat) return response.status(404).json({ message: 'Asiento no encontrado' })
  const existing = await SeatLock.findOne({ where: { seatId: Number(seatId), functionId: Number(functionId), expiresAt: { [Op.gt]: new Date() } } })
  if (existing) return response.status(409).json({ message: 'El asiento ya esta bloqueado' })
  const lock = await SeatLock.create({ seatId: Number(seatId), functionId: Number(functionId), userId, expiresAt: new Date(Date.now() + 10 * 60 * 1000) })
  return response.status(201).json(lock)
})
bookingRouter.delete('/seatLocks/:id', authMiddleware, async (request, response) => { await SeatLock.destroy({ where: { id: Number(request.params.id) } }); return response.status(204).send() })

bookingRouter.get('/carts', authMiddleware, async (request: AuthenticatedRequest, response) => {
  const userId = userIdFrom(request)
  const [cart] = await Cart.findOrCreate({ where: { userId } })
  return response.json([cart])
})
bookingRouter.post('/carts', authMiddleware, async (request: AuthenticatedRequest, response) => response.status(201).json(await Cart.create({ userId: userIdFrom(request) })))
bookingRouter.patch('/carts/:id', authMiddleware, async (request, response) => response.json(await Cart.update(request.body, { where: { id: Number(request.params.id) }, returning: true }).then((result: any) => result[1][0])))
bookingRouter.get('/cartSnacks', authMiddleware, async (request, response) => response.json(await CartSnack.findAll({ where: { cartId: Number(request.query.cartId) }, include: [{ model: Snack, as: 'snack' }] })))
bookingRouter.post('/cartSnacks', authMiddleware, async (request, response) => response.status(201).json(await CartSnack.create({ cartId: Number(request.body.cartId), snackId: Number(request.body.snackId), quantity: Number(request.body.quantity ?? 1) })))
bookingRouter.delete('/cartSnacks/:id', authMiddleware, async (request, response) => { await CartSnack.destroy({ where: { id: Number(request.params.id) } }); return response.status(204).send() })
bookingRouter.get('/snacks', async (_request, response) => response.json(await Snack.findAll({ order: [['name', 'ASC']] })))

bookingRouter.post('/orders', authMiddleware, async (request: AuthenticatedRequest, response) => {
  const order = await Order.create({ userId: userIdFrom(request), total: Number(request.body.total ?? 0), status: 'PENDING' })
  return response.status(201).json(order)
})
bookingRouter.get('/orders', authMiddleware, async (request: AuthenticatedRequest, response) => response.json(await Order.findAll({ where: { userId: userIdFrom(request) }, order: [['createdAt', 'DESC']] })))
bookingRouter.post('/payments', authMiddleware, async (request, response) => response.status(201).json(await Payment.create({ orderId: Number(request.body.orderId), amount: Number(request.body.amount), method: request.body.method ?? 'CARD', status: 'APPROVED', transactionId: crypto.randomUUID() })))
bookingRouter.post('/tickets', authMiddleware, async (request, response) => {
  const items = Array.isArray(request.body) ? request.body : [request.body]
  const tickets = await Ticket.bulkCreate(items.map((item: any) => ({ orderId: Number(item.orderId), functionId: Number(item.functionId), seatId: Number(item.seatId), price: Number(item.price ?? 0), qrCode: crypto.randomUUID(), status: 'VALID' })))
  return response.status(201).json(tickets)
})
bookingRouter.get('/tickets', authMiddleware, async (request, response) => response.json(await Ticket.findAll({ where: { orderId: Number(request.query.orderId) } })))
bookingRouter.get('/functions/:functionId/seats', async (request, response) => response.json(await Seat.findAll({ where: { functionId: Number(request.params.functionId) } })))

void CinemaFunction
