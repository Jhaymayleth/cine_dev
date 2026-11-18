import 'dotenv/config'

const required = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} no esta definido en las variables de entorno`)
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.APP_PORT ?? 3000),
  postgresHost: process.env.POSTGRES_HOST ?? 'localhost',
  postgresPort: Number(process.env.POSTGRES_PORT ?? 5433),
  postgresDb: process.env.POSTGRES_DB ?? 'multicine',
  postgresUser: process.env.POSTGRES_USER ?? 'multicine',
  postgresPassword: process.env.POSTGRES_PASSWORD ?? 'multicine-local-password',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
} as const
