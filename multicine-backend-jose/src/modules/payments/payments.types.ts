export type PaymentStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED'
export type Payment = { id: string; orderId: string; amount: number; currency: string; method: string; status: PaymentStatus; transactionId: string | null }
