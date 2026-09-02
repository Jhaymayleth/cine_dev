export type UserRole = 'CLIENT' | 'STAFF' | 'ADMIN'
export type UserProfile = { id: string; fullName: string; email: string; phone: string; role: UserRole }
