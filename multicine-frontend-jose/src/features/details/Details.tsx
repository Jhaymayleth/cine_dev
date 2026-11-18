import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Film,
  MapPin,
  Star,
  Ticket,
} from 'lucide-react'

import { Button } from '@/components/button'
import { MovieArtwork, moviesApi } from '@/features/movies'
import type { Movie } from '@/features/movies'
import type { MovieFunction } from '@/types'
import { featuredMovies } from '@/features/movies/types/movies.types'

import Footer from '../landing/components/Footer'
import Navbar from '../landing/components/Navbar'
import MovieDetailSkeleton from './MovieDetailSkeleton'

/** Toda la cartelera sale de `/movies/:id/functions`; no hay horarios aleatorios. */
const FALLBACK_VENUE = 'Sede principal'

const dateKeyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const dateKeyOfIso = (iso: string): string => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : dateKeyOf(date)
}

const dateLabelOf = (date: Date): string => {
  if (dateKeyOf(date) === dateKeyOf(new Date())) {
    return 'HOY'
  }
  return date
    .toLocaleDateString('es-CO', { weekday: 'short' })
    .replace('.', '')
    .toUpperCase()
    .slice(0, 3)
}

const timeLabelOf = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })

const venueOf = (item: MovieFunction): string =>
  item.cinemaName?.trim() || FALLBACK_VENUE

const roomOf = (item: MovieFunction): string =>
  `${item.format} - ${item.roomName || 'Sala'}`

const getStoredVenue = (): string | null => {
  try {
    const raw = localStorage.getItem('selectedLocation')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { venue?: string }
    return typeof parsed.venue === 'string' ? parsed.venue : null
  } catch {
    return null
  }
}

const Details = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [storedVenue] = useState<string | null>(getStoredVenue)
  const [selectedVenue, setSelectedVenue] = useState('')
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedFunctionId, setSelectedFunctionId] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    navigate('/', { replace: true })
  }

  const {
    data: movie,
    isLoading,
    error,
  } = useQuery<Movie, Error>({
    queryKey: ['movie', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Falta el id de la película')
      }

      try {
        const allMovies = await moviesApi.getAll()
        const found = allMovies.find((m) => m.id === id)
        if (found) {
          return found
        }
      } catch {
        // Fallback silencioso si la API no está disponible.
      }

      const fallbackMovie =
        featuredMovies.find((item) => item.id === id) ?? featuredMovies[0]

      if (!fallbackMovie) {
        throw new Error(`La película "${id}" no existe en el catálogo`)
      }

      return fallbackMovie
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: functions = [], isLoading: functionsLoading } = useQuery<
    MovieFunction[],
    Error
  >({
    queryKey: ['movie-functions', id, selectedDateKey],
    queryFn: () => moviesApi.getFunctionsByMovie(id as string),
    enabled: !!id,
    staleTime: 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (!selectedVenue) return
    localStorage.setItem(
      'selectedLocation',
      JSON.stringify({ venue: selectedVenue }),
    )
  }, [selectedVenue])

  const venues = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of functions) {
      const name = venueOf(item)
      if (!map.has(name)) map.set(name, item.cityName?.trim() || '')
    }
    return [...map].map(([name, city]) => ({ name, city }))
  }, [functions])

  const dateOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: { key: string; label: string; day: number }[] = []
    for (const item of functions) {
      const date = new Date(item.startsAt)
      if (Number.isNaN(date.getTime())) continue
      const key = dateKeyOf(date)
      if (seen.has(key)) continue
      seen.add(key)
      options.push({ key, label: dateLabelOf(date), day: date.getDate() })
    }
    return options.slice(0, 5)
  }, [functions])

  useEffect(() => {
    if (venues.length === 0) return
    const preferred = venues.find((venue) => venue.name === storedVenue)
    setSelectedVenue((current) => {
      if (venues.some((venue) => venue.name === current)) return current
      return preferred?.name ?? venues[0].name
    })
  }, [venues, storedVenue])

  useEffect(() => {
    if (dateOptions.length === 0) return
    setSelectedDateKey((current) =>
      dateOptions.some((date) => date.key === current)
        ? current
        : dateOptions[0].key,
    )
  }, [dateOptions])

  const roomOptions = useMemo(() => {
    const rooms = new Set<string>()
    for (const item of functions) {
      if (venueOf(item) !== selectedVenue) continue
      if (!selectedDateKey || dateKeyOfIso(item.startsAt) !== selectedDateKey)
        continue
      rooms.add(roomOf(item))
    }
    return [...rooms]
  }, [functions, selectedVenue, selectedDateKey])

  const functionOptions = useMemo(
    () =>
      functions.filter(
        (item) =>
          venueOf(item) === selectedVenue &&
          dateKeyOfIso(item.startsAt) === selectedDateKey &&
          roomOf(item) === selectedRoom,
      ),
    [functions, selectedVenue, selectedDateKey, selectedRoom],
  )

  useEffect(() => {
    if (roomOptions.length === 0) {
      if (selectedRoom) setSelectedRoom('')
      return
    }
    if (!roomOptions.includes(selectedRoom)) setSelectedRoom(roomOptions[0])
  }, [roomOptions, selectedRoom])

  useEffect(() => {
    if (!selectedRoom) {
      if (selectedFunctionId) setSelectedFunctionId('')
      return
    }
    if (!functionOptions.some((item) => item.id === selectedFunctionId)) {
      setSelectedFunctionId('')
    }
  }, [functionOptions, selectedRoom, selectedFunctionId])

  const isSelectionComplete =
    !!selectedVenue &&
    !!selectedDateKey &&
    !!selectedRoom &&
    !!selectedFunctionId

  const scrollToShowtimes = () => {
    document.getElementById('showtimes-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleContinue = () => {
    if (!isSelectionComplete) {
      return
    }

    setConfirmed(true)
  }

  if (isLoading) {
    return <MovieDetailSkeleton />
  }

  if (error || !movie) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">Película no encontrada</p>
        <Button
          variant="ghost"
          onClick={handleBack}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate min-h-[700px] overflow-hidden">
        <nav>
          <Navbar />
        </nav>

        <button
          type="button"
          onClick={handleBack}
          className="
            absolute left-4 top-24 z-20
            inline-flex items-center gap-2
            rounded-lg border border-white/20
            bg-black/40 px-3 py-2
            text-sm font-medium text-white
            backdrop-blur-md
            transition-colors duration-200
            hover:bg-black/60
            sm:left-6 lg:left-8
          "
        >
          <ArrowLeft className="size-4" />
          Volver
        </button>

        <div className="absolute inset-0 -z-20">
          <MovieArtwork
            palette={movie.palette}
            image={movie.image}
            variant="backdrop"
            className="h-full w-full"
          />
        </div>

        <div
          className="
            absolute inset-0 -z-10
            bg-linear-to-r
            from-black/95
            via-black/75
            to-black/30
          "
        />

        <div
          className="
            absolute inset-x-0 bottom-0 -z-10
            h-72
            bg-linear-to-t
            from-background
            via-background/70
            to-transparent
          "
        />

        <div
          className="
            mx-auto flex min-h-[700px]
            max-w-7xl items-center
            px-4 py-24
            sm:px-6
            lg:px-8
          "
        >
          <div
            className="
              flex w-full
              flex-col
              gap-10
              md:flex-row
              md:items-center
              md:gap-12
            "
          >
            <div className="mx-auto w-56 shrink-0 sm:w-64 md:mx-0 lg:w-72">
              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border border-white/20
                  bg-black/20
                  shadow-2xl
                  shadow-black/50
                "
              >
                <MovieArtwork
                  palette={movie.palette}
                  image={movie.image}
                  variant="poster"
                  className="aspect-2/3"
                />
              </div>
            </div>

            <div className="max-w-3xl text-center md:text-left">
              <span
                className="
                  inline-flex
                  rounded-full
                  border border-primary/40
                  bg-primary/15
                  px-3 py-1
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-white
                "
              >
                {movie.status === 'Today'
                  ? 'En cartelera'
                  : movie.status === 'Premiere'
                    ? 'Estreno'
                    : 'Próximamente'}
              </span>

              <h1
                className="
                  mt-5
                  font-heading
                  text-4xl
                  font-bold
                  leading-tight
                  tracking-tight
                  text-white
                  sm:text-5xl
                  lg:text-6xl
                "
              >
                {movie.title}
              </h1>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  justify-center
                  gap-x-5
                  gap-y-3
                  text-sm
                  text-white/80
                  md:justify-start
                "
              >
                <span>{movie.rating}</span>
                <span className="text-white/30">•</span>
                <span>{movie.duration}</span>
                <span className="text-white/30">•</span>
                <span>{movie.format}</span>

                {movie.score > 0 && (
                  <>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1 font-semibold text-white">
                      <Star size={16} className="fill-accent text-accent" />
                      {movie.score.toFixed(1)}
                    </span>
                  </>
                )}
              </div>

              <div
                className="
                  mt-6
                  flex
                  flex-wrap
                  justify-center
                  gap-2
                  md:justify-start
                "
              >
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="
                      rounded-full
                      border border-white/20
                      bg-white/10
                      px-3 py-1.5
                      text-xs
                      font-medium
                      text-white/90
                      backdrop-blur-sm
                    "
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p
                className="
                  mt-7
                  max-w-2xl
                  text-sm
                  leading-7
                  text-white/75
                  sm:text-base
                "
              >
                {movie.description}
              </p>

              <div className="mt-8 flex justify-center md:justify-start">
                <Button
                  size="lg"
                  onClick={scrollToShowtimes}
                  className="
                    h-12
                    rounded-xl
                    border-0
                    bg-linear-to-r from-[#800021] to-[#C24366]
                    px-7
                    text-base
                    text-white
                    shadow-md shadow-[#C24366]/20
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:shadow-lg hover:shadow-[#C24366]/30
                    md:inline-flex
                  "
                >
                  <Ticket data-icon="inline-start" />
                  Ver funciones
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="showtimes-section"
        className="relative mx-auto max-w-7xl px-4 pb-4 pt-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-[30px] border border-[#eadfe1] bg-[#f8f5f5] p-4 shadow-[0_10px_30px_rgba(35,20,22,0.08)] sm:p-6">
          <div className="relative mb-5 overflow-x-auto pb-1">
            <div className="relative mx-auto min-w-[420px] max-w-[780px]">
              <div className="absolute left-[12.5%] right-[12.5%] top-1/2 h-[2px] -translate-y-1/2 bg-[#e0d0d5]" />
              <div
                className={`absolute left-[12.5%] top-1/2 h-[2px] -translate-y-1/2 bg-[#C24366] transition-all duration-300 ${
                  selectedFunctionId
                    ? 'w-[75%]'
                    : selectedRoom
                      ? 'w-[50%]'
                      : selectedDateKey
                        ? 'w-[25%]'
                        : selectedVenue
                          ? 'w-[12.5%]'
                          : 'w-0'
                }`}
              />

              <div className="relative z-10 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((step) => {
                  const isCompleted =
                    (step === 1 && !!selectedVenue) ||
                    (step === 2 && selectedDateKey !== null) ||
                    (step === 3 && !!selectedRoom) ||
                    (step === 4 && !!selectedFunctionId)

                  const isCurrent =
                    (step === 1 && !selectedVenue) ||
                    (step === 2 &&
                      !!selectedVenue &&
                      selectedDateKey === null) ||
                    (step === 3 &&
                      selectedDateKey !== null &&
                      !selectedRoom) ||
                    (step === 4 && !!selectedRoom && !selectedFunctionId)

                  return (
                    <div key={step} className="flex justify-center">
                      <div
                        className={`flex h-7 w-7 -translate-y-[1px] items-center justify-center rounded-full border text-[10px] font-bold ${
                          isCompleted
                            ? 'border-[#800021] bg-linear-to-r from-[#800021] to-[#C24366] text-white shadow-md shadow-[#C24366]/20'
                            : isCurrent
                              ? 'border-[#800021] bg-white text-[#800021] shadow-sm shadow-[#C24366]/10'
                              : 'border-[#d9c8cb] bg-white text-[#7d5d62]'
                        }`}
                      >
                        {step}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-[22px] border border-[#e8dfe2] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7E6EB]">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#800021]">
                  Paso 1
                </span>
              </div>

              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f5c5f]">
                Debe elegir la sede
              </p>

              <label className="block">
                <span className="sr-only">Sede</span>
                <div className="relative">
                  <select
                    value={selectedVenue}
                    disabled={venues.length === 0}
                    onChange={(event) => setSelectedVenue(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#eadfe1] bg-[#f7f4f4] px-3 py-3 pr-10 text-sm font-medium text-[#2d1d20] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="" className="bg-white text-[#2d1d20]">
                      {venues.length === 0
                        ? 'Sin sedes con funciones'
                        : 'Selecciona una sede'}
                    </option>
                    {venues.map((venue) => (
                      <option
                        key={venue.name}
                        value={venue.name}
                        className="bg-white text-[#2d1d20]"
                      >
                        {venue.city ? `${venue.city} · ` : ''}
                        {venue.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-primary">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M5.25 7.5 10 12.25 14.75 7.5h-9.5Z" />
                    </svg>
                  </span>
                </div>
              </label>
            </div>

            <div className="rounded-[22px] border border-[#e8dfe2] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7E6EB]">
                  <CalendarDays className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#800021]">
                  Paso 2
                </span>
              </div>

              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f5c5f]">
                Elegir la fecha
              </p>

              {dateOptions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
                  {dateOptions.map((date) => (
                    <button
                      key={date.key}
                      type="button"
                      onClick={() => setSelectedDateKey(date.key)}
                      className={`rounded-xl border px-2 py-2 text-center transition-all ${
                        selectedDateKey === date.key
                          ? 'border-[#800021] bg-linear-to-r from-[#800021] to-[#C24366] text-white shadow-md shadow-[#C24366]/20'
                          : 'border-[#eadfe1] bg-[#f9f5f5] text-[#2d1d20] hover:border-[#C24366]/50 hover:text-[#800021]'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em]">
                        {date.label}
                      </div>
                      <div className="mt-1 text-sm font-bold">{date.day}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#e7d1d7] bg-[#faf7f7] p-3 text-sm text-[#7d5d62]">
                  Sin fechas disponibles
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-[#e8dfe2] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7E6EB]">
                  <Film className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#800021]">
                  Paso 3
                </span>
              </div>

              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f5c5f]">
                Elegir la sala
              </p>

              {roomOptions.length > 0 ? (
                <div className="space-y-2">
                  {roomOptions.map((room) => (
                    <button
                      key={room}
                      type="button"
                      onClick={() => setSelectedRoom(room)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all ${
                        selectedRoom === room
                          ? 'border-[#800021] bg-linear-to-r from-[#800021] to-[#C24366] text-white shadow-md shadow-[#C24366]/20'
                          : 'border-[#eadfe1] bg-[#f9f5f5] text-[#2d1d20] hover:border-[#C24366]/50 hover:text-[#800021]'
                      }`}
                    >
                      {room}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#e7d1d7] bg-[#faf7f7] p-3 text-sm text-[#7d5d62]">
                  Sin salas para la sede y fecha elegidas
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-[#e8dfe2] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7E6EB]">
                  <Clock3 className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#800021]">
                  Paso 4
                </span>
              </div>

              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f5c5f]">
                Elegir el horario
              </p>

              {selectedRoom && functionOptions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {functionOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={item.isSoldOut}
                      onClick={() => setSelectedFunctionId(item.id)}
                      title={
                        item.availableSeats !== undefined
                          ? `${item.availableSeats} asientos disponibles`
                          : undefined
                      }
                      className={`rounded-xl border px-2.5 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                        selectedFunctionId === item.id
                          ? 'border-[#800021] bg-linear-to-r from-[#800021] to-[#C24366] text-white shadow-md shadow-[#C24366]/20'
                          : 'border-[#eadfe1] bg-[#f9f5f5] text-[#2d1d20] hover:border-[#C24366]/50 hover:text-[#800021]'
                      }`}
                    >
                      {timeLabelOf(item.startsAt)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#e7d1d7] bg-[#faf7f7] p-3 text-sm text-[#7d5d62]">
                  {!selectedRoom
                    ? 'Elige primero la sede, la fecha y la sala'
                    : functionsLoading
                      ? 'Cargando funciones...'
                      : 'No hay funciones disponibles para esta sala'}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!isSelectionComplete}
              className="
                h-12
                rounded-xl
                border-0
                bg-linear-to-r from-[#800021] to-[#C24366]
                px-7
                text-base
                font-semibold
                text-white
                shadow-md shadow-[#C24366]/20
                transition-all duration-200
                hover:-translate-y-0.5
                hover:shadow-lg hover:shadow-[#C24366]/30
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              {confirmed ? 'Función confirmada' : 'Continuar'}
            </Button>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <div
          className="
            rounded-2xl
            border border-border
            bg-card
            p-6
            shadow-sm
            sm:p-8
          "
        >
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Información de la película
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Clasificación
              </p>
              <p className="mt-2 font-semibold text-foreground">
                {movie.rating}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Duración
              </p>
              <p className="mt-2 font-semibold text-foreground">
                {movie.duration}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Formato
              </p>
              <p className="mt-2 font-semibold text-foreground">
                {movie.format}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Fecha de estreno
              </p>
              <p className="mt-2 font-semibold text-foreground">
                {movie.releaseDate ?? 'No disponible'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <Footer />
      </footer>
    </main>
  )
}

export default Details
