import crypto from 'node:crypto'
import { Op } from 'sequelize'
import { Router } from 'express'
import {
  Cart,
  CartSnack,
  CinemaFunction,
  Order,
  OrderSeat,
  Payment,
  Seat,
  SeatLock,
  Snack,
  Ticket,
} from '../models/index.js'
import { sequelize } from '../config/database.js'
import { asyncHandler } from '../core/http/async-handler.js'
import { validateBody } from '../core/http/validate.middleware.js'
import { authMiddleware, type AuthenticatedRequest } from '../middlewares/auth.middleware.js'
import { seatsWithState } from '../shared/utils/seat-availability.js'
import { cartSnackSchema, checkoutSchema, orderSchema, paymentSchema, seatLockSchema } from './schemas.js'

export const bookingRouter = Router()

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
  validateBody(seatLockSchema),
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

      // Un asiento con ticket vendido no se puede volver a bloquear.
      const sold = await Ticket.findOne({
        where: { seatId, functionId, status: { [Op.ne]: 'CANCELLED' } },
        transaction,
      })
      if (sold) return 'sold' as const

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
    if (result === 'sold') return response.status(409).json({ message: 'El asiento ya tiene ticket' })
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
  validateBody(cartSnackSchema),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const cartId = positiveId(request.body?.cartId)
    const snackId = positiveId(request.body?.snackId)
    // cartId, snackId y quantity ya vienen validados y normalizados por Zod.
    const quantity = Number(request.body.quantity)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    if (!cartId || !snackId) return badRequest(response, 'cartId y snackId son obligatorios')

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
  validateBody(orderSchema),
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
 * Checkout: convierte asientos ya bloqueados por el usuario en una orden.
 * Exige bloqueo vigente y propio, valida función/asiento contra la BD y
 * calcula el total con el precio de la función. El cliente no manda precios.
 */
bookingRouter.post(
  '/checkout',
  authMiddleware,
  validateBody(checkoutSchema),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })

    const uniqueSeats = new Map<string, { functionId: number; seatId: number }>()
    for (const item of request.body.seats) {
      uniqueSeats.set(`${item.functionId}:${item.seatId}`, item)
    }
    const wanted = [...uniqueSeats.values()]

    const result = await sequelize.transaction(async (transaction) => {
      const functionIds = [...new Set(wanted.map((item) => item.functionId))]
      const seatIds = [...new Set(wanted.map((item) => item.seatId))]

      const functions = await CinemaFunction.findAll({
        where: {
          id: { [Op.in]: functionIds },
          status: 'ACTIVE',
          startsAt: { [Op.gt]: new Date() },
        },
        transaction,
      })
      const priceByFunction = new Map(
        functions.map((item: any) => [Number(item.id), Number(item.basePrice)]),
      )
      if (functions.length !== functionIds.length) return 'function' as const

      const seats = await Seat.findAll({
        where: { id: { [Op.in]: seatIds } },
        transaction,
      })
      const seatById = new Map(seats.map((seat: any) => [Number(seat.id), seat]))
      if (
        wanted.some(
          (item) =>
            !seatById.has(item.seatId) ||
            Number(seatById.get(item.seatId)?.get('functionId')) !== item.functionId,
        )
      ) {
        return 'seat' as const
      }

      const sold = await Ticket.findOne({
        where: {
          functionId: { [Op.in]: functionIds },
          seatId: { [Op.in]: seatIds },
          status: { [Op.ne]: 'CANCELLED' },
        },
        transaction,
      })
      if (sold) return 'sold' as const

      // El bloqueo es la reserva temporal: sin él, otro usuario podría haber
      // tomado el asiento mientras se armaba la orden.
      const locks = await SeatLock.findAll({
        where: {
          userId,
          functionId: { [Op.in]: functionIds },
          seatId: { [Op.in]: seatIds },
          expiresAt: { [Op.gt]: new Date() },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      const lockedByUser = new Set(
        locks.map((lock: any) => `${Number(lock.functionId)}:${Number(lock.seatId)}`),
      )
      if (wanted.some((item) => !lockedByUser.has(`${item.functionId}:${item.seatId}`))) {
        return 'lock' as const
      }

      const total = wanted.reduce(
        (sum, item) => sum + (priceByFunction.get(item.functionId) ?? 0),
        0,
      )
      const order = await Order.create({ userId, total, status: 'PENDING' }, { transaction })
      await OrderSeat.bulkCreate(
        wanted.map((item) => ({
          orderId: order.get('id'),
          functionId: item.functionId,
          seatId: item.seatId,
          unitPrice: priceByFunction.get(item.functionId),
        })),
        { transaction },
      )
      return order
    })

    if (result === 'function') return response.status(409).json({ message: 'La funcion ya no esta disponible' })
    if (result === 'seat') return badRequest(response, 'Uno de los asientos no pertenece a esa funcion')
    if (result === 'sold') return response.status(409).json({ message: 'Uno de los asientos ya tiene ticket' })
    if (result === 'lock') return response.status(409).json({ message: 'Uno de los asientos ya no esta bloqueado por ti' })
    return response.status(201).json(result)
  }),
)

/**
 * Registra la intención de pago. Nace PENDING y el monto sale de la orden;
 * solo el proveedor (webhook) puede pasarla a APPROVED.
 */
bookingRouter.post(
  '/payments',
  authMiddleware,
  validateBody(paymentSchema),
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const orderId = positiveId(request.body?.orderId)
    const method = String(request.body?.method ?? 'CARD').toUpperCase()
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    if (!orderId) return badRequest(response, 'orderId es obligatorio')
    if (!['CARD', 'CASH', 'PSE'].includes(method)) return badRequest(response, 'Metodo de pago no valido')

    const order = await Order.findOne({ where: { id: orderId, userId } })
    if (!order) return response.status(404).json({ message: 'Orden no encontrada' })

    // Idempotente: reintentar el pago no crea cobros duplicados.
    const existing = await Payment.findOne({ where: { orderId } })
    if (existing) return response.status(200).json(existing)

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
 * Emite los tickets de una orden propia. Los asientos y precios salen de
 * OrderSeat (no del cliente) y el pago debe estar registrado; quedan PENDING
 * hasta que el proveedor confirme el cobro.
 */
bookingRouter.post(
  '/orders/:orderId/tickets',
  authMiddleware,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const userId = userIdOf(request)
    const orderId = positiveId(request.params.orderId)
    if (!userId) return response.status(401).json({ message: 'No autenticado' })
    if (!orderId) return badRequest(response, 'orderId no es valido')

    const result = await sequelize.transaction(async (transaction) => {
      const order = await Order.findOne({
        where: { id: orderId, userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (!order) return 'order' as const

      const payment = await Payment.findOne({ where: { orderId }, transaction })
      if (!payment) return 'payment' as const

      const orderSeats = await OrderSeat.findAll({ where: { orderId }, transaction })
      if (orderSeats.length === 0) return 'empty' as const

      // Idempotente: si ya se emitieron, se devuelven los existentes.
      const existing = await Ticket.findAll({ where: { orderId }, transaction })
      if (existing.length > 0) return existing

      const functionIds = [...new Set(orderSeats.map((item: any) => Number(item.functionId)))]
      const seatIds = [...new Set(orderSeats.map((item: any) => Number(item.seatId)))]

      const taken = await Ticket.findOne({
        where: {
          functionId: { [Op.in]: functionIds },
          seatId: { [Op.in]: seatIds },
          status: { [Op.ne]: 'CANCELLED' },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      })
      if (taken) return 'sold' as const

      const tickets = await Ticket.bulkCreate(
        orderSeats.map((item: any) => ({
          orderId,
          functionId: Number(item.functionId),
          seatId: Number(item.seatId),
          price: item.unitPrice,
          qrCode: crypto.randomUUID(),
          status: 'PENDING',
        })),
        { transaction },
      )

      // El ticket ya ocupa el asiento: el bloqueo temporal deja de hacer falta.
      await SeatLock.destroy({
        where: {
          userId,
          functionId: { [Op.in]: functionIds },
          seatId: { [Op.in]: seatIds },
        },
        transaction,
      })

      return tickets
    })

    if (result === 'order') return response.status(404).json({ message: 'Orden no encontrada' })
    if (result === 'payment') return response.status(409).json({ message: 'Registra el pago antes de emitir los tickets' })
    if (result === 'empty') return badRequest(response, 'La orden no tiene asientos')
    if (result === 'sold') return response.status(409).json({ message: 'Uno de los asientos ya tiene ticket' })
    return response.status(201).json(result)
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

bookingRouter.get('/functions/:functionId/seats', async (request, response) => {
  const functionId = positiveId(request.params.functionId)
  if (!functionId) return badRequest(response, 'functionId no es valido')
  return response.json(await seatsWithState(functionId))
})
