import { isAxiosError } from 'axios'
import { apiClient } from '@/api/client'
import type { RegisterFormData } from '@/validations/auth.validation'
import type { RegisterResponse, LoginCredentials, LoginResponse, User } from '@/types'

/**
 * Un fallo de red o del backend NUNCA crea una sesión falsa: se propaga un
 * error claro. Antes cualquier caída de la API devolvía un token mock y el
 * usuario creía haber iniciado sesión.
 */
function apiError(error: unknown, fallback: string): Error {
  if (isAxiosError(error) && error.response?.status === 401) {
    return new Error('Credenciales inválidas. Verifique su correo y contraseña.', { cause: error })
  }
  if (isAxiosError(error) && typeof error.response?.data?.message === 'string') {
    return new Error(error.response.data.message, { cause: error })
  }
  return new Error(fallback, { cause: error })
}

export const authService = {
  async register(data: RegisterFormData): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>('/auth/register', data)
      return response.data
    } catch (error) {
      throw apiError(error, 'No se pudo completar el registro. Verifica tu conexión e inténtalo de nuevo.')
    }
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw apiError(error, 'No se pudo iniciar sesión. Verifica tu conexión e inténtalo de nuevo.')
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/profile')
      return response.data
    } catch (error) {
      const savedUserStr = localStorage.getItem('multicine_user')
      if (savedUserStr) {
        return JSON.parse(savedUserStr)
      }
      throw new Error('Sesión no encontrada o expirada.', { cause: error })
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore API logout error in offline/mock mode
    } finally {
      localStorage.removeItem('multicine_token')
      localStorage.removeItem('multicine_user')
    }
  },
}


