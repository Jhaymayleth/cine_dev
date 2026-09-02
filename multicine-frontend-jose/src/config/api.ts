import type { ApiConfig } from '@/types/config'

export const apiConfig: ApiConfig = {
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'https://33dfb5ad-947a-4c04-a41b-eb42ed5ee8f5.mock.pstmn.io'}/api`,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10_000,
}

