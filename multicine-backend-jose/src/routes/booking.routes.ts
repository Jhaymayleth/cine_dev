import crypto from 'node:crypto'
import { Op } from 'sequelize'
import { Router } from 'express'
import {
  Cart,
  CartSnack,
  CinemaFunction,
  Order,
  Payment,
  Seat,
  SeatLock,
  Snack,
  Ticket,
} from '../models/index.js'
import { sequelize } from '../config/database.js'
import { asyncHandler } from '../core/http/async-handler.js'
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware.js'

export const bookingRouter = Router()

const MAX_TICKETS_PER_ORDER = 10
const MAX_SNACK_QUANTITY = 50

/** Solo el usuario del token: nunca userId del body/query. */
const userIdOf = (request: AuthenticatedRequest): number | null => {
  const id = Number(request.user?.userId)
  return Number.isInteger(id) && id > 0 ? id : null
}

const positiveId = (value: unknown): number | null => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

const badRequest = (response: any, message: string) => response.status(400).json({ message })

/** Bloqueo temporal atómico por asiento. */
bookingRouter.post(
  '/seatLocks',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })

    const seatId = positiveId(request.body?.seatId)
    const functionId = positiveId(request.body?.functionId)
    if (!seatId || !functionId) return badRequest(response, 'seatId y functionId son obligatorios')

    const result = await sequelize.transaction(async (transaction) => {
      const seat = await Seat.findOne({
        where: { id: seatId, functionId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!seat) return 'not_found' as const

      const existing = await SeatLock.findOne({
        where: { seatId, functionId, expiresAt: { [Op.gt]: new Date() } },
        transaction,
      })
      if (existing) return 'locked' as const

      const lock = await SeatLock.create(
        {
          seatId,
          functionId,
          userId,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        { transaction },
      )
      return lock
    })

    if (result === 'not_found') return response.status(404).json({ message: 'Asiento no encontrado' })
    if (result === 'locked') return response.status(409).json({ message: 'El asiento ya esta bloqueado' })
    return response.status(201).json(result)
  }),
)

bookingRouter.delete(
  '/seatLocks/:id',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const id = positiveId(request.params.id)
    if (!userId || !id) return response.status(404).json({ message: 'Bloqueo no encontrado' })

    // El dueño del bloqueo o nadie: antes cualquier usuario podía borrar el ajeno.
    const lock = await SeatLock.findOne({ where: { id, userId } })
    if (!lock) return response.status(404).json({ message: 'Bloqueo no encontrado' })
    await lock.destroy()
    return response.status(204).send()
  }),
)

bookingRouter.get(
  '/carts',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    const [cart] = await Cart.findOrCreate({ where: { userId } })
    return response.json([cart])
  }),
)

bookingRouter.post(
  '/carts',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    const [cart, created] = await Cart.findOrCreate({ where: { userId } })
    return response.status(created ? 201 : 200).json(cart)
  }),
)

bookingRouter.patch(
  '/carts/:id',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const id = positiveId(request.params.id)
    if (!userId || !id) return response.status(404).json({ message: 'Carrito no encontrado' })

    const cart = await Cart.findOne({ where: { id, userId } })
    if (!cart) return response.status(404).json({ message: 'Carrito no encontrado' })

    // El carrito no tiene campos editables por el cliente. Antes se hacía
    // `Cart.update(request.body)`, que permitía mass assignment (userId, id).
    return badRequest(response, 'El carrito no tiene campos editables')
  }),
)

bookingRouter.get(
  '/cartSnacks',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const cartId = positiveId(request.query.cartId)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    if (!cartId) return badRequest(response, 'cartId es obligatorio')

    const cart = await Cart.findOne({ where: { id: cartId, userId } })
    if (!cart) return response.status(404).json({ message: 'Carrito no encontrado' })

    return response.json(
      await CartSnack.findAll({ where: { cartId }, include: [{ model: Snack, as: 'snack' }] }),
    )
  }),
)

bookingRouter.post(
  '/cartSnacks',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const cartId = positiveId(request.body?.cartId)
    const snackId = positiveId(request.body?.snackId)
    const quantity = Number(request.body?.quantity ?? 1)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    if (!cartId || !snackId) return badRequest(response, 'cartId y snackId son obligatorios')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_SNACK_QUANTITY) {
      return badRequest(response, `La cantidad debe ser un entero entre 1 y ${MAX_SNACK_QUANTITY}`)
    }

    const [cart, snack] = await Promise.all([
      Cart.findOne({ where: { id: cartId, userId } }),
      Snack.findByPk(snackId),
    ])
    if (!cart) return response.status(404).json({ message: 'Carrito no encontrado' })
    if (!snack) return response.status(404).json({ message: 'Producto no encontrado' })

    const item = await CartSnack.create({ cartId, snackId, quantity })
    return response.status(201).json(item)
  }),
)

bookingRouter.delete(
  '/cartSnacks/:id',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const id = positiveId(request.params.id)
    if (!userId || !id) return response.status(404).json({ message: 'Producto no encontrado' })

    const item = await CartSnack.findOne({
      where: { id },
      include: [{ model: Cart, as: 'cart', where: { userId } }],
    })
    if (!item) return response.status(404).json({ message: 'Producto no encontrado' })
    await item.destroy()
    return response.status(204).send()
  }),
)

bookingRouter.get('/snacks', async (_request, response) =>
  response.json(await Snack.findAll({ order: [['name', 'ASC']] })),
)

/**
 * Crea la orden. El total SIEMPRE se calcula con los precios de la BD:
 * el cliente solo manda qué productos quiere, nunca cuánto cuestan.
 */
bookingRouter.post(
  '/orders',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })

    const rawItems = Array.isArray(request.body?.items) ? request.body.items : []
    const items = rawItems
      .map((item: any) => ({
        snackId: positiveId(item?.snackId),
        quantity: Number(item?.quantity),
      }))
      .filter((item: any) => item.snackId && Number.isInteger(item.quantity) && item.quantity > 0)

    if (items.length === 0) return badRequest(response, 'La orden necesita al menos un producto')

    const snacks = await Snack.findAll({ where: { id: { [Op.in]: items.map((i: any) => i.snackId) } } })
    const priceById = new Map(snacks.map((snack: any) => [Number(snack.id), Number(snack.price)]))
    if (items.some((item: any) => !priceById.has(item.snackId))) {
      return badRequest(response, 'Uno de los productos no existe')
    }

    const total = items.reduce(
      (sum: number, item: any) => sum + (priceById.get(item.snackId) ?? 0) * item.quantity,
      0,
    )

    const order = await Order.create({ userId, total, status: 'PENDING' })
    return response.status(201).json(order)
  }),
)

bookingRouter.get(
  '/orders',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    return response.json(
      await Order.findAll({ where: { userId }, order: [['createdAt', 'DESC']] }),
    )
  }),
)

/**
 * Registra la intención de pago. Nace PENDING y el monto sale de la orden;
 * solo el proveedor (webhook) puede pasarla a APPROVED.
 */
bookingRouter.post(
  '/payments',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const orderId = positiveId(request.body?.orderId)
    const method = String(request.body?.method ?? 'CARD').toUpperCase()
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    if (!orderId) return badRequest(response, 'orderId es obligatorio')
    if (!['CARD', 'CASH', 'PSE'].includes(method)) return badRequest(response, 'Metodo de pago no valido')

    const order = await Order.findOne({ where: { id: orderId, userId } })
    if (!order) return response.status(404).json({ message: 'Orden no encontrada' })

    const payment = await Payment.create({
      orderId,
      amount: order.get('total'),
      method,
      status: 'PENDING',
      transactionId: `pending-${crypto.randomUUID()}`,
    })
    return response.status(201).json(payment)
  }),
)

/**
 * Emite tickets de una orden propia. Precio y función se validan contra la
 * BD; el cliente no puede inventar precio, asiento ni orden ajena.
 */
bookingRouter.post(
  '/tickets',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })

    const rawItems = Array.isArray(request.body) ? request.body : [request.body]
    if (rawItems.length === 0 || rawItems.length > MAX_TICKETS_PER_ORDER) {
      return badRequest(response, `Se permiten entre 1 y ${MAX_TICKETS_PER_ORDER} tickets`)
    }

    const items = rawItems.map((item: any) => ({
      orderId: positiveId(item?.orderId),
      functionId: positiveId(item?.functionId),
      seatId: positiveId(item?.seatId),
    }))
    if (items.some((item: any) => !item.orderId || !item.functionId || !item.seatId)) {
      return badRequest(response, 'orderId, functionId y seatId son obligatorios')
    }

    const orderIds = [...new Set(items.map((item: any) => item.orderId))] as number[]
    const ownedOrders = await Order.findAll({ where: { id: { [Op.in]: orderIds }, userId } })
    if (ownedOrders.length !== orderIds.length) {
      return response.status(403).json({ message: 'La orden no pertenece al usuario' })
    }

    const seatIds = [...new Set(items.map((item: any) => item.seatId))] as number[]
    const seats = await Seat.findAll({ where: { id: { [Op.in]: seatIds } } })
    const seatById = new Map(seats.map((seat: any) => [Number(seat.id), seat]))
    if (items.some((item: any) => seatById.get(item.seatId)?.get('functionId') !== item.functionId)) {
      return badRequest(response, 'El asiento no pertenece a esa funcion')
    }

    const functions = await CinemaFunction.findAll({
      where: { id: { [Op.in]: [...new Set(items.map((item: any) => item.functionId))] }, status: 'ACTIVE' },
    })
    const functionById = new Map(functions.map((item: any) => [Number(item.id), item]))
    if (items.some((item: any) => !functionById.has(item.functionId))) {
      return badRequest(response, 'La funcion no esta disponible')
    }

    const existing = await Ticket.findOne({
      where: {
        functionId: { [Op.in]: items.map((item: any) => item.functionId) },
        seatId: { [Op.in]: seatIds },
        status: { [Op.ne]: 'CANCELLED' },
      },
    })
    if (existing) return response.status(409).json({ message: 'Uno de los asientos ya tiene ticket' })

    const tickets = await sequelize.transaction(async (transaction) => {
      // Revalidar dentro de la transacción cierra la carrera entre dos compras.
      const duplicated = await Ticket.findOne({
        where: {
          functionId: { [Op.in]: items.map((item: any) => item.functionId) },
          seatId: { [Op.in]: seatIds },
          status: { [Op.ne]: 'CANCELLED' },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (duplicated) return null

      return Ticket.bulkCreate(
        items.map((item: any) => ({
          orderId: item.orderId,
          functionId: item.functionId,
          seatId: item.seatId,
          price: functionById.get(item.functionId)?.get('basePrice'),
          qrCode: crypto.randomUUID(),
          status: 'VALID',
        })),
        { transaction },
      )
    })

    if (!tickets) return response.status(409).json({ message: 'Uno de los asientos ya tiene ticket' })
    return response.status(201).json(tickets)
  }),
)

bookingRouter.get(
  '/tickets',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const orderId = positiveId(request.query.orderId)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    if (!orderId) return badRequest(response, 'orderId es obligatorio')

    const order = await Order.findOne({ where: { id: orderId, userId } })
    if (!order) return response.status(404).json({ message: 'Orden no encontrada' })

    return response.json(await Ticket.findAll({ where: { orderId } }))
  }),
)

bookingRouter.get('/functions/:functionId/seats', async (request, response) =>
  response.json(
    await Seat.findAll({
      where: { functionId: Number(request.params.functionId) },
      order: [['row', 'ASC'], ['number', 'ASC']],
    }),
  ),
)
