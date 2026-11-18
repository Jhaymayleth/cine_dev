import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/store/useAuthStore'
import { authService } from '@/services/auth.service'

// El login real habla con la API; aquí se aísla para probar el store y, sobre
// todo, que un fallo de autenticación no deje sesión abierta.
vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}))

const mockedAuth = vi.mocked(authService)

const user = {
  id: '1',
  fullName: 'Juan Pérez',
  email: 'juan@ejemplo.com',
  role: 'CLIENT',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  })

  it('should initialize with empty state when localStorage is clear', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should login successfully and save token and user in localStorage', async () => {
    mockedAuth.login.mockResolvedValue({
      message: 'Inicio de sesion exitoso',
      token: 'jwt-real',
      user,
    })

    const response = await useAuthStore
      .getState()
      .login({ email: user.email, password: 'Password123' })

    expect(response.token).toBe('jwt-real')
    expect(response.user.email).toBe(user.email)

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('jwt-real')
    expect(localStorage.getItem('multicine_token')).toBe('jwt-real')
  })

  it('should not create a session when the API rejects the credentials', async () => {
    mockedAuth.login.mockRejectedValue(new Error('Credenciales invalidas'))

    await expect(
      useAuthStore.getState().login({ email: user.email, password: 'incorrecta' }),
    ).rejects.toThrow('Credenciales invalidas')

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
    expect(state.error).toBe('Credenciales invalidas')
    expect(localStorage.getItem('multicine_token')).toBeNull()
  })

  it('should logout cleanly and clear localStorage', async () => {
    mockedAuth.login.mockResolvedValue({
      message: 'Inicio de sesion exitoso',
      token: 'jwt-real',
      user,
    })
    mockedAuth.logout.mockResolvedValue(undefined)

    await useAuthStore.getState().login({ email: user.email, password: 'Password123' })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    await useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(localStorage.getItem('multicine_token')).toBeNull()
  })
})
