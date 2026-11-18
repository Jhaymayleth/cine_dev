import { Op } from 'sequelize'
import { Seat, SeatLock, Ticket } from '../../models/index.js'

export type SeatState = 'AVAILABLE' | 'LOCKED' | 'OCCUPIED'

const seatKey = (functionId: unknown, seatId: unknown): string => `${Number(functionId)}:${Number(seatId)}`

/**
 * Estado real de cada asiento de una función: vendido, bloqueado por un
 * carrito ajeno o disponible. Antes `/seats` devolvía asientos sin estado y
 * `availableSeats` se forzaba a la capacidad de la sala.
 */
export const seatStatesFor = async (functionId: number): Promise<Map<number, SeatState>> => {
  const [sold, locked] = await Promise.all([
    Ticket.findAll({
      where: { functionId, status: { [Op.ne]: 'CANCELLED' } },
      attributes: ['seatId'],
    }),
    SeatLock.findAll({
      where: { functionId, expiresAt: { [Op.gt]: new Date() } },
      attributes: ['seatId'],
    }),
  ])

  const soldIds = new Set(sold.map((ticket: any) => Number(ticket.seatId)))
  const lockedIds = new Set(locked.map((lock: any) => Number(lock.seatId)))
  const states = new Map<number, SeatState>()
  for (const seatId of soldIds) states.set(seatId, 'OCCUPIED')
  for (const seatId of lockedIds) {
    if (!states.has(seatId)) states.set(seatId, 'LOCKED')
  }
  return states
}

export const seatsWithState = async (functionId: number) => {
  const [seats, states] = await Promise.all([
    Seat.findAll({ where: { functionId }, order: [['row', 'ASC'], ['number', 'ASC']] }),
    seatStatesFor(functionId),
  ])
  return seats.map((seat: any) => ({
    ...seat.toJSON(),
    status: states.get(Number(seat.id)) ?? 'AVAILABLE',
  }))
}

/**
 * Disponibilidad por función sin N+1: una consulta de tickets y otra de
 * bloqueos para todas las funciones pedidas.
 */
export const availabilityFor = async (functions: { id: unknown; capacity: unknown }[]) => {
  const ids = functions.map((item) => Number(item.id))
  const [sold, locked] = await Promise.all([
    Ticket.findAll({
      where: { functionId: { [Op.in]: ids }, status: { [Op.ne]: 'CANCELLED' } },
      attributes: ['functionId', 'seatId'],
    }),
    SeatLock.findAll({
      where: { functionId: { [Op.in]: ids }, expiresAt: { [Op.gt]: new Date() } },
      attributes: ['functionId', 'seatId'],
    }),
  ])

  const unavailable = new Set<string>([
    ...sold.map((ticket: any) => seatKey(ticket.functionId, ticket.seatId)),
    ...locked.map((lock: any) => seatKey(lock.functionId, lock.seatId)),
  ])

  const availability = new Map<number, { availableSeats: number; isSoldOut: boolean }>()
  for (const item of functions) {
    const functionId = Number(item.id)
    const taken = [...unavailable].filter((key) => key.startsWith(`${functionId}:`)).length
    const availableSeats = Math.max(0, Number(item.capacity) - taken)
    availability.set(functionId, { availableSeats, isSoldOut: availableSeats === 0 })
  }
  return availability
}
