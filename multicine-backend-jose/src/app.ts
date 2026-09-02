import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { router } from './routes/index.js'
import { openapi } from './docs/openapi.js'

export const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: env.corsOrigin, credentials: true }))

app.use('/api', router)
app.get('/api/docs.json', (_request, response) => response.json(openapi))

app.get('/health', (_request, response) => {
  response.status(200).json({ message: 'Healthy' })
})
