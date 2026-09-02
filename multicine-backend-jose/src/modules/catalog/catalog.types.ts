export type MovieStatus = 'ACTIVE' | 'UPCOMING' | 'INACTIVE'

export type MovieSummary = {
  id: string
  title: string
  synopsis: string
  classification: string
  durationMin: number
  posterUrl: string | null
  genres: string[]
  status: MovieStatus
}
