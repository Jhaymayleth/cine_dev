import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { router } from './routes/index.js'
import { openapi } from './docs/openapi.js'
import { errorHandler } from './core/http/error-handler.middleware.js'
import { notFoundHandler } from './core/http/not-found.middleware.js'

export const app = express()

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(cors({ origin: env.corsOrigin, credentials: true }))

app.use('/api', router)
app.get('/api/docs.json', (_request, response) => response.json(openapi))

app.get('/health', (_request, response) => {
  response.status(200).json({ message: 'Healthy' })
})

// Sin estos dos el 404 y los errores caen en el handler por defecto de
// Express (HTML) y las promesas rechazadas quedan sin respuesta.
app.use(notFoundHandler)
app.use(errorHandler)
