export type PaginationQuery = { page?: number; limit?: number; search?: string }
export type Paginated<T> = { data: T[]; page: number; limit: number; total: number; totalPages: number }
