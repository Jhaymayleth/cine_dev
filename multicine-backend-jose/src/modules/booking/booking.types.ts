export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'SOLD'
export type Seat = { id: string; functionId: string; row: string; number: number; status: SeatStatus }
export type SeatLock = { id: string; seatId: string; userId: string; expiresAt: string }
