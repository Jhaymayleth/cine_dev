import { sequelize } from '../config/database.js'
import { initModels } from '../models/index.js'
import { seedDatabase } from './seed.js'

initModels()

export const initializeDatabase = async (): Promise<void> => {
  await sequelize.sync()
  await seedDatabase()
}
