'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Armchair, Loader2 } from 'lucide-react'

import { ApiError } from '@/api'
import { bookingApi } from '@/features/reservations/api'
import type { Seat } from '@/types'
import { useAuthStore } from '@/store'

const MAX_SEATS = 6

interface SeatMapProps {
  functionId: string
  selectedSeatIds: string[]
  onChange: (seatIds: string[]) => void
}

type SeatVisualState = 'AVAILABLE' | 'LOCKED' | 'OCCUPIED' | 'SELECTED'

const seatClasses: Record<SeatVisualState, string> = {
  AVAILABLE:
    'border-[#d8c3c9] bg-white text-[#5c4247] hover:border-[#C24366] hover:text-[#800021]',
  SELECTED:
    'border-[#800021] bg-linear-to-r from-[#800021] to-[#C24366] text-white shadow-md shadow-[#C24366]/25',
  LOCKED: 'cursor-not-allowed border-[#eadfe1] bg-[#efe6e8] text-[#b39aa0]',
  OCCUPIED: 'cursor-not-allowed border-[#5b4a4d] bg-[#5b4a4d] text-[#cfc0c3]',
}

/**
 * Mapa de asientos de una función. El estado (vendido/bloqueado) lo calcula el
 * backend; los bloqueos propios se guardan aquí para poder liberarlos.
 */
export default function SeatMap({
  functionId,
  selectedSeatIds,
  onChange,
}: SeatMapProps) {
  const { isAuthenticated } = useAuthStore()
  const [myLocks, setMyLocks] = useState<Record<string, string>>({})
  const [pendingSeatId, setPendingSeatId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const locksRef = useRef<Record<string, string>>({})

  const {
    data: seats = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Seat[], Error>({
    queryKey: ['seats', functionId],
    queryFn: () => bookingApi.getSeatsByFunction(functionId),
    enabled: !!functionId,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    retry: 1,
  })

  useEffect(() => {
    locksRef.current = myLocks
    onChange(Object.keys(myLocks))
  }, [myLocks, onChange])

  // Al cambiar de función o desmontar, liberar los bloqueos propios.
  useEffect(() => {
    return () => {
      for (const lockId of Object.values(locksRef.current)) {
        void bookingApi.deleteSeatLock(lockId).catch(() => undefined)
      }
      locksRef.current = {}
    }
  }, [functionId])

  useEffect(() => {
    setMyLocks({})
    setError(null)
  }, [functionId])

  const rows = useMemo(() => {
    const byRow = new Map<string, Seat[]>()
    for (const seat of seats) {
      const key = seat.row
      if (!byRow.has(key)) byRow.set(key, [])
      byRow.get(key)?.push(seat)
    }
    for (const rowSeats of byRow.values()) {
      rowSeats.sort((a, b) => Number(a.number) - Number(b.number))
    }
    return [...byRow.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [seats])

  const stateOf = (seat: Seat): SeatVisualState => {
    if (myLocks[seat.id]) return 'SELECTED'
    if (seat.status === 'OCCUPIED') return 'OCCUPIED'
    if (seat.status === 'LOCKED') return 'LOCKED'
    return 'AVAILABLE'
  }

  const releaseSeat = async (seatId: string) => {
    const lockId = myLocks[seatId]
    if (!lockId) return

    setMyLocks((current) => {
      const { [seatId]: _released, ...rest } = current
      return rest
    })
    setError(null)

    try {
      await bookingApi.deleteSeatLock(lockId)
    } catch {
      // El bloqueo expira solo; no bloqueamos la UI por un fallo al liberar.
    }
    void refetch()
  }

  const handleSeatClick = async (seat: Seat) => {
    if (!isAuthenticated || pendingSeatId) return
    if (myLocks[seat.id]) {
      await releaseSeat(seat.id)
      return
    }
    if (seat.status && seat.status !== 'AVAILABLE') return
    if (selectedSeatIds.length >= MAX_SEATS) {
      setError(`Puedes reservar hasta ${MAX_SEATS} asientos por compra.`)
      return
    }

    setPendingSeatId(seat.id)
    setError(null)
    try {
      const lock = await bookingApi.createSeatLock({
        seatId: seat.id,
        functionId,
      })
      setMyLocks((current) => ({ ...current, [seat.id]: lock.id }))
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null
      if (apiError?.status === 401) {
        setError('Tu sesión no es válida. Inicia sesión para reservar.')
      } else if (apiError?.status === 404) {
        setError('Ese asiento ya no existe para esta función.')
      } else if (apiError?.status === 409) {
        setError('Ese asiento acaba de ser tomado por otra persona.')
      } else {
        setError(apiError?.message ?? 'No se pudo bloquear el asiento.')
      }
      void refetch()
    } finally {
      setPendingSeatId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#7d5d62]">
        <Loader2 className="size-4 animate-spin" />
        Cargando asientos...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed border-[#e7d1d7] bg-[#faf7f7] p-4 text-sm text-[#7d5d62]">
        No se pudieron cargar los asientos de esta función.
      </div>
    )
  }

  if (seats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#e7d1d7] bg-[#faf7f7] p-4 text-sm text-[#7d5d62]">
        Esta función todavía no tiene asientos configurados.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!isAuthenticated && (
        <div className="rounded-xl border border-[#f0c9d2] bg-[#F7E6EB] px-4 py-3 text-sm text-[#800021]">
          Necesitas iniciar sesión para bloquear asientos.{' '}
          <Link to="/login" className="font-semibold underline underline-offset-2">
            Entrar
          </Link>
        </div>
      )}

      <div className="mx-auto h-2 w-3/4 rounded-full bg-linear-to-r from-transparent via-[#c9aeb4] to-transparent" />
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[#9c7f85]">
        Pantalla
      </p>

      <div className="space-y-2 overflow-x-auto pb-2">
        {rows.map(([row, rowSeats]) => (
          <div key={row} className="flex min-w-[280px] items-center justify-center gap-2">
            <span className="w-5 shrink-0 text-center text-xs font-bold text-[#9c7f85]">
              {row}
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {rowSeats.map((seat) => {
                const state = stateOf(seat)
                const isPending = pendingSeatId === seat.id
                return (
                  <button
                    key={seat.id}
                    type="button"
                    aria-pressed={state === 'SELECTED'}
                    aria-label={`Fila ${seat.row}, asiento ${seat.number}`}
                    title={`Fila ${seat.row} · asiento ${seat.number}`}
                    disabled={
                      !isAuthenticated ||
                      state === 'OCCUPIED' ||
                      state === 'LOCKED' ||
                      isPending
                    }
                    onClick={() => void handleSeatClick(seat)}
                    className={`flex size-8 items-center justify-center rounded-md border text-[11px] font-semibold transition-all disabled:cursor-not-allowed ${seatClasses[state]}`}
                  >
                    {isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      seat.number
                    )}
                  </button>
                )
              })}
            </div>
            <span className="w-5 shrink-0" />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#7d5d62]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-[#d8c3c9] bg-white" />
          Disponible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-linear-to-r from-[#800021] to-[#C24366]" />
          Seleccionado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[#efe6e8]" />
          Bloqueado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[#5b4a4d]" />
          Vendido
        </span>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[#800021]">
        <Armchair className="size-4" />
        {selectedSeatIds.length} de {MAX_SEATS} asientos seleccionados
      </p>

      {error && (
        <p role="alert" className="text-center text-sm font-medium text-[#a11d3d]">
          {error}
        </p>
      )}
    </div>
  )
}
