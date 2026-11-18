import { describe, expect, it } from 'vitest'
import {
  MAX_TICKETS_PER_ORDER,
  cartSnackSchema,
  checkoutSchema,
  loginSchema,
  paymentSchema,
  registerSchema,
} from '../../src/routes/schemas'

describe('checkoutSchema', () => {
  it('acepta asientos con ids numéricos o en texto', () => {
    const result = checkoutSchema.safeParse({
      seats: [
        { functionId: '3', seatId: 12 },
        { functionId: 3, seatId: '13' },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.seats[0]).toEqual({ functionId: 3, seatId: 12 })
    }
  })

  it('rechaza una compra sin asientos', () => {
    expect(checkoutSchema.safeParse({ seats: [] }).success).toBe(false)
  })

  it('rechaza ids inválidos y precios enviados por el cliente', () => {
    expect(checkoutSchema.safeParse({ seats: [{ functionId: 1, seatId: -2 }] }).success).toBe(false)
    const withPrice = checkoutSchema.safeParse({
      seats: [{ functionId: 1, seatId: 2, price: 1 }],
    })
    // Zod elimina claves desconocidas: aunque el cliente mande `price`, no llega.
    expect(withPrice.success && 'price' in withPrice.data.seats[0]).toBe(false)
  })

  it(`rechaza más de ${MAX_TICKETS_PER_ORDER} asientos`, () => {
    const seats = Array.from({ length: MAX_TICKETS_PER_ORDER + 1 }, (_, index) => ({
      functionId: 1,
      seatId: index + 1,
    }))
    expect(checkoutSchema.safeParse({ seats }).success).toBe(false)
  })
})

describe('paymentSchema', () => {
  it('usa CARD por defecto y rechaza métodos fuera del enum', () => {
    const result = paymentSchema.safeParse({ orderId: '7' })
    expect(result.success && result.data.method).toBe('CARD')
    expect(paymentSchema.safeParse({ orderId: 7, method: 'BITCOIN' }).success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('normaliza el correo y exige una contraseña de 8 caracteres', () => {
    const result = registerSchema.safeParse({
      fullName: 'Ana Torres',
      email: 'ANA@Ejemplo.com',
      phone: '3001234567',
      password: 'secreto123',
    })
    expect(result.success && result.data.email).toBe('ana@ejemplo.com')
    expect(
      registerSchema.safeParse({
        fullName: 'Ana Torres',
        email: 'ana@ejemplo.com',
        phone: '3001234567',
        password: 'corta',
      }).success,
    ).toBe(false)
  })
})

describe('loginSchema y cartSnackSchema', () => {
  it('rechaza credenciales vacías', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false)
  })

  it('limita la cantidad de confitería', () => {
    expect(cartSnackSchema.safeParse({ cartId: 1, snackId: 2, quantity: 0 }).success).toBe(false)
    expect(cartSnackSchema.safeParse({ cartId: 1, snackId: 2, quantity: 2 }).success).toBe(true)
  })
})
