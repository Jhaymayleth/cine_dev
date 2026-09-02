import { Sequelize } from 'sequelize'
import { env } from './env.js'

export const sequelize = new Sequelize(env.postgresDb, env.postgresUser, env.postgresPassword, {
  host: env.postgresHost,
  port: env.postgresPort,
  dialect: 'postgres',
  logging: false,
})
