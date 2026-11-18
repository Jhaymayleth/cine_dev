export type TicketStatus = 'PENDING' | 'VALID' | 'USED' | 'CANCELLED'
export type Ticket = { id: string; orderId: string; functionId: string; seatId: string; price: number; qrCode: string; status: TicketStatus }
