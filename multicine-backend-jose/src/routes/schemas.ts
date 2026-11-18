import { z } from 'zod'

export const MAX_TICKETS_PER_ORDER = 10
export const MAX_SNACK_QUANTITY = 50

const id = z.coerce.number().int().positive()

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres').max(120),
  email: z.email('El correo no es valido').toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, 'El telefono no es valido'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .max(72, 'La contrasena no puede superar 72 caracteres'),
})

export const loginSchema = z.object({
  email: z.email('El correo no es valido').toLowerCase(),
  password: z.string().min(1, 'La contrasena es obligatoria'),
})

export const seatLockSchema = z.object({
  seatId: id,
  functionId: id,
})

export const cartSnackSchema = z.object({
  cartId: id,
  snackId: id,
  quantity: z.coerce
    .number()
    .int('La cantidad debe ser un entero')
    .min(1, 'La cantidad minima es 1')
    .max(MAX_SNACK_QUANTITY, `La cantidad maxima es ${MAX_SNACK_QUANTITY}`),
})

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        snackId: id,
        quantity: z.coerce
          .number()
          .int('La cantidad debe ser un entero')
          .min(1, 'La cantidad minima es 1')
          .max(MAX_SNACK_QUANTITY, `La cantidad maxima es ${MAX_SNACK_QUANTITY}`),
      }),
    )
    .min(1, 'La orden necesita al menos un producto')
    .max(MAX_SNACK_QUANTITY, 'Demasiados productos en la orden'),
})

const checkoutSeatSchema = z.object({
  functionId: id,
  seatId: id,
})

/** La orden de compra se arma con asientos ya bloqueados; el precio no viaja. */
export const checkoutSchema = z.object({
  seats: z
    .array(checkoutSeatSchema)
    .min(1, 'La compra necesita al menos un asiento')
    .max(MAX_TICKETS_PER_ORDER, `Se permiten maximo ${MAX_TICKETS_PER_ORDER} asientos`),
})

export const paymentSchema = z.object({
  orderId: id,
  method: z.enum(['CARD', 'CASH', 'PSE']).default('CARD'),
})

