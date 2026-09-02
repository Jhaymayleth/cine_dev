export type AccessTokenPayload = {
  userId: string
  email: string
  role: string
}

export type PasswordPolicy = {
  minLength: number
  requireUppercase: boolean
  requireNumber: boolean
}
