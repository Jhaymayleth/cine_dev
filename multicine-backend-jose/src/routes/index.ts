import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { bookingRouter } from './booking.routes.js'
import { catalogRouter } from './catalog.routes.js'

export const router = Router()

router.use('/auth', authRouter)
router.use(catalogRouter)
router.use(bookingRouter)
