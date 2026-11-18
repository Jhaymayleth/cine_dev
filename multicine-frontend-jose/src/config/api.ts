import type { ApiConfig } from '@/types/config'

export const apiConfig: ApiConfig = {
  // El backend propio es el origen por defecto; el mock de Postman queda como
  // opción explícita vía NEXT_PUBLIC_API_URL.
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api`,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10_000,
}

