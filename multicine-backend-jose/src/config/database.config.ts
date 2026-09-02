import type { DatabaseConfig } from '../core/database/database.types.js'
import { env } from './env.js'

export const databaseConfig: DatabaseConfig = {
  host: env.postgresHost,
  port: env.postgresPort,
  database: env.postgresDb,
  username: env.postgresUser,
  password: env.postgresPassword,
}
