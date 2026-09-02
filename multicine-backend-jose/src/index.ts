import { app } from './app.js'
import { env } from './config/env.js'
import { sequelize } from './config/database.js'
import { initializeDatabase } from './database/index.js'

const start = async (): Promise<void> => {
  await sequelize.authenticate()
  await initializeDatabase()
  console.log('Conexion a la BD establecida')

  app.listen(env.port, () => {
    console.log(`Servidor escuchando en puerto ${env.port}`)
  })
}

start().catch((error: unknown) => {
  console.error('No se pudo iniciar el backend', error)
  process.exit(1)
})
