export type AuthUser = {
  id: string
  fullName: string
  email: string
  phone: string
  role: string
}

export type AuthResponse = {
  token: string
  user: AuthUser
}
